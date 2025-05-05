import sys
import json
import pandas as pd
import numpy as np
from sklearn.cluster import KMeans
from sklearn.preprocessing import StandardScaler
from sklearn.decomposition import PCA

# Read data from stdin
data_json = sys.stdin.read()
data = json.loads(data_json)

# Convert to DataFrame
df = pd.DataFrame(data)

# Feature extraction
features = []
if 'totalSpent' in df.columns:
    features.append('totalSpent')
if 'frequency' in df.columns:
    features.append('frequency')

# For recency, we need to convert any date fields
if 'last_purchase_date' in df.columns:
    df['last_purchase_date'] = pd.to_datetime(df['last_purchase_date'])
    df['recency'] = (pd.Timestamp.now() - df['last_purchase_date']).dt.days
    features.append('recency')

# If we don't have enough features, try to use other numeric columns
if len(features) < 2:
    for col in df.columns:
        if pd.api.types.is_numeric_dtype(df[col]) and col not in features:
            features.append(col)
            if len(features) >= 3:
                break

# Prepare features for clustering
X = df[features].copy()

# Handle missing values
X = X.fillna(X.mean())

# Standardize features
scaler = StandardScaler()
X_scaled = scaler.fit_transform(X)

# Determine optimal number of clusters using elbow method
wcss = []
max_clusters = min(10, len(df) - 1)
for i in range(1, max_clusters + 1):
    kmeans = KMeans(n_clusters=i, random_state=42, n_init=10)
    kmeans.fit(X_scaled)
    wcss.append(kmeans.inertia_)

# Find the "elbow" - where the rate of decrease sharply changes
elbow_found = False
optimal_clusters = 3  # default if we can't find an elbow
if len(wcss) > 3:
    differences = np.diff(wcss)
    second_differences = np.diff(differences)
    for i in range(len(second_differences)):
        if abs(second_differences[i]) > np.mean(abs(second_differences)) * 1.5:
            optimal_clusters = i + 2  # +2 because of two diff operations
            elbow_found = True
            break

# Perform K-means clustering with optimal clusters
kmeans = KMeans(n_clusters=optimal_clusters, random_state=42, n_init=10)
clusters = kmeans.fit_predict(X_scaled)

# Add cluster labels to original data
df['cluster'] = clusters

# Create segment names
segment_names = {
    0: "Budget Shoppers",
    1: "Regular Customers",
    2: "Premium Buyers",
    3: "High-Value Clients",
    4: "Occasional Shoppers",
    5: "New Customers",
    6: "VIP Customers",
    7: "Infrequent Buyers",
    8: "Seasonal Shoppers",
    9: "Specialized Buyers"
}

# Make sure we have enough names
for i in range(optimal_clusters):
    if i not in segment_names:
        segment_names[i] = f"Segment {i+1}"

# Add segment names
df['segment_name'] = df['cluster'].map(lambda x: segment_names.get(x, f"Segment {x+1}"))

# Calculate cluster centers and properties
cluster_stats = {}
for cluster_id in range(optimal_clusters):
    cluster_df = df[df['cluster'] == cluster_id]
    
    # Basic stats for this cluster
    stats = {
        "count": len(cluster_df),
        "percentage": len(cluster_df) / len(df) * 100,
        "name": segment_names.get(cluster_id, f"Segment {cluster_id+1}")
    }
    
    # Add feature means
    for feature in features:
        stats[f"avg_{feature}"] = cluster_df[feature].mean()
    
    # Add additional stats like size preferences, price ranges, etc.
    for col in df.columns:
        if col not in features and col not in ['cluster', 'segment_name']:
            if pd.api.types.is_categorical_dtype(df[col]) or pd.api.types.is_object_dtype(df[col]):
                # For categorical data (like sizes, colors, etc.)
                value_counts = cluster_df[col].value_counts()
                if not value_counts.empty:
                    stats[f"top_{col}"] = value_counts.index[0]
                    stats[f"top_{col}_percentage"] = value_counts.iloc[0] / len(cluster_df) * 100
    
    cluster_stats[cluster_id] = stats

# Perform PCA for visualization
pca = PCA(n_components=2)
X_pca = pca.fit_transform(X_scaled)
df['pca_x'] = X_pca[:, 0]
df['pca_y'] = X_pca[:, 1]

# Prepare result object
result = {
    "clusters": df[['cluster', 'segment_name', 'pca_x', 'pca_y']].to_dict('records'),
    "cluster_stats": cluster_stats,
    "features_used": features,
    "optimal_clusters": optimal_clusters,
    "elbow_data": {
        "wcss": wcss,
        "cluster_range": list(range(1, max_clusters + 1))
    },
    "is_elbow_found": elbow_found
}

# Generate insights for each cluster
insights = []
for cluster_id, stats in cluster_stats.items():
    segment_name = stats["name"]
    count = stats["count"]
    percentage = stats["percentage"]
    
    insight = {
        "segment_name": segment_name,
        "title": f"{segment_name} - {count} customers ({percentage:.1f}%)",
        "characteristics": []
    }
    
    # Add relevant characteristics
    if "avg_totalSpent" in stats:
        insight["characteristics"].append(f"Average spend: ₹{stats['avg_totalSpent']:.2f}")
    
    if "avg_frequency" in stats:
        insight["characteristics"].append(f"Purchase frequency: {stats['avg_frequency']:.1f} orders")
    
    if "avg_recency" in stats:
        insight["characteristics"].append(f"Last purchase: {stats['avg_recency']:.0f} days ago")
    
    # Add size and print preferences if available
    for col in stats:
        if col.startswith("top_") and not col.endswith("_percentage"):
            base_col = col[4:]  # Remove "top_" prefix
            if f"{col}_percentage" in stats:
                percentage = stats[f"{col}_percentage"]
                insight["characteristics"].append(f"Preferred {base_col}: {stats[col]} ({percentage:.1f}%)")
    
    # Add a recommendation based on segment characteristics
    recommendation = "General recommendation: "
    
    # For high-value segments
    if "avg_totalSpent" in stats and stats["avg_totalSpent"] > df["totalSpent"].mean() * 1.5:
        recommendation += "Offer exclusive products and loyalty rewards to maintain their high engagement."
    
    # For infrequent but valuable customers
    elif "avg_totalSpent" in stats and "avg_frequency" in stats and stats["avg_totalSpent"] > df["totalSpent"].mean() and stats["avg_frequency"] < df["frequency"].mean():
        recommendation += "Send periodic reminders and special offers to encourage more frequent purchases."
    
    # For frequent but low-spending customers
    elif "avg_totalSpent" in stats and "avg_frequency" in stats and stats["avg_totalSpent"] < df["totalSpent"].mean() and stats["avg_frequency"] > df["frequency"].mean():
        recommendation += "Introduce premium options or bundles to increase their average order value."
    
    # For recent customers
    elif "avg_recency" in stats and stats["avg_recency"] < df["recency"].mean() * 0.5:
        recommendation += "Follow up with satisfaction surveys and welcome offers to build loyalty."
    
    # For customers who haven't purchased recently
    elif "avg_recency" in stats and stats["avg_recency"] > df["recency"].mean() * 1.5:
        recommendation += "Send re-engagement campaigns with special discounts to win them back."
    
    # Default recommendation
    else:
        recommendation += "Tailor your marketing and product inventory to match their preferences."
    
    insight["recommendation"] = recommendation
    insights.append(insight)

result["insights"] = insights

# Output JSON result
print(json.dumps(result))