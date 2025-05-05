// Customer Login
document.getElementById('customer-login')?.addEventListener('submit', function(e) {
  e.preventDefault();
  const email = document.getElementById('login-customer-email').value;
  const password = document.getElementById('login-customer-password').value;

  fetch('/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: email, password })
  })
  .then(response => response.json())
  .then(data => {
    if (data.role === 'customer') {
      localStorage.setItem('username', email); // save username
      if (data.profileComplete) {
        // profile exists, redirect to customer dashboard
        window.location.href = '/customer.html'; // Redirect to customer dashboard
      } else {
        // profile missing, redirect to questions
        window.location.href = '/customer-questions.html';
      }
    } else if (data.role === 'shopkeeper') {
      localStorage.setItem('username', email); // Save username locally
      if (data.profileComplete) {
        // profile exists, redirect to shopkeeper dashboard
        window.location.href = '/shopkeeper.html'; // Already completed profile
      } else {
        // profile missing, redirect to shopkeeper questions
        window.location.href = '/shopkeeper-questions.html'; // Needs to complete questions
      }
    } else {
      alert('Invalid credentials');
    }
  })
  .catch(err => {
    alert('Error: ' + err.message);
  });
});

// Shopkeeper Login
document.getElementById('shopkeeper-login')?.addEventListener('submit', function(e) {
  e.preventDefault();
  const email = document.getElementById('login-shopkeeper-email').value;
  const password = document.getElementById('login-shopkeeper-password').value;

  fetch('/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: email, password })
  })
  .then(response => response.json())
  .then(data => {
    if (data.role === 'shopkeeper') {
      localStorage.setItem('username', email); // save username
      if (data.profileComplete) {
        // profile exists, redirect to shopkeeper dashboard
        window.location.href = '/shopkeeper.html';
      } else {
        // profile missing, redirect to shopkeeper questions
        window.location.href = '/shopkeeper-questions.html';
      }
    } else {
      alert('Invalid credentials');
    }
  })
  .catch(err => {
    alert('Error: ' + err.message);
  });
});

// Customer Sign Up
document.getElementById('customer-signup')?.addEventListener('submit', function(e) {
  e.preventDefault();
  const data = {
    username: document.getElementById('customer-email').value,
    password: document.getElementById('customer-password').value,
    role: 'customer'
  };

  fetch('/signup', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  })
  .then(response => response.json())
  .then(data => {
    if (data.message === 'Signup successful') {
      alert('Customer signed up successfully!');
      window.location.href = '/login.html';  // Redirect to login after signup
    } else {
      alert('Error: ' + data.message);
    }
  })
  .catch(err => alert('Error: ' + err.message));
});

// Shopkeeper Sign Up
document.getElementById('shopkeeper-signup')?.addEventListener('submit', function(e) {
  e.preventDefault();
  const data = {
    username: document.getElementById('shopkeeper-email').value,
    password: document.getElementById('shopkeeper-password').value,
    role: 'shopkeeper'
  };

  fetch('/signup', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  })
  .then(response => response.json())
  .then(data => {
    if (data.message === 'Signup successful') {
      alert('Shopkeeper signed up successfully!');
      window.location.href = '/login.html';  // Redirect to login after signup
    } else {
      alert('Error: ' + data.message);
    }
  })
  .catch(err => alert('Error: ' + err.message));
});

// Forgot Password
document.getElementById('forgot-password-form')?.addEventListener('submit', function(e) {
  e.preventDefault();
  const email = document.getElementById('reset-email').value;

  fetch('/forgot-password', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email })
  })
  .then(response => response.json())
  .then(data => {
    if (data.message === 'Password reset email sent') {
      alert('Password reset email sent!');
      window.location.href = '/login.html'; // Redirect to login page after reset request
    } else {
      alert('Error: ' + data.message);
    }
  })
  .catch(err => alert('Error: ' + err.message));
});

// Customer Questions Submission
document.getElementById('customer-questions-form')?.addEventListener('submit', function(e) {
  e.preventDefault();

  const data = {
    username: localStorage.getItem('username'),
    phone: document.getElementById('phone').value,
    age: document.getElementById('age').value,
    gender: document.getElementById('gender').value,
    areaName: document.getElementById('area-name').value,
    pincode: document.getElementById('pincode').value,
    city: document.getElementById('city').value,
    state: document.getElementById('state').value,
    tshirtSize: document.getElementById('tshirt-size').value,
    printType: document.getElementById('print-type').value,
    priceRange: document.getElementById('price-range').value,
  };
  
  // Check username presence
  if (!data.username) {
    alert('User not logged in. Please log in first.');
    window.location.href = '/login.html';
    return;
  }
  
  fetch('/customer-questions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  })
  .then(response => response.json())
  .then(data => {
    if (data.message === 'Questions submitted successfully') {
      window.location.href = '/customer.html'; // Redirect to customer dashboard
    } else {
      alert('Error: ' + data.message);
    }
  })
  .catch(err => {
    alert('Error: ' + err.message);
  });
});

// Shopkeeper Questions Submission
document.getElementById('shopkeeper-questions-form')?.addEventListener('submit', function(e) {
  e.preventDefault();

  const data = {
    username: localStorage.getItem('username'),
    areaName: document.getElementById('area-name').value,
    city: document.getElementById('city').value,
    state: document.getElementById('state').value,
    pincode: document.getElementById('pincode').value,
    products: document.getElementById('products').value,
  };

  if (!data.username) {
    alert('User not logged in. Please log in first.');
    window.location.href = '/login.html';
    return;
  }

  fetch('/shopkeeper-questions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  })
  .then(response => response.json())
  .then(data => {
    if (data.message === 'Answers submitted successfully') {
      window.location.href = '/shopkeeper.html'; // Redirect to shopkeeper dashboard
    } else {
      alert('Error: ' + data.message);
    }
  })
  .catch(err => {
    alert('Error: ' + err.message);
  });
});
// Helper Functions
function showNotification(message, type = 'success') {
  const notification = document.getElementById('notification');
  if (notification) {
    notification.textContent = message;
    notification.style.backgroundColor = type === 'success' ? '#4CAF50' : '#f44336';
    notification.style.display = 'block';
    
    // Hide after 3 seconds
    setTimeout(() => {
      notification.style.display = 'none';
    }, 3000);
  }
}

// Check if we're on the shopkeeper dashboard page
document.addEventListener('DOMContentLoaded', function() {
  const addInventoryForm = document.getElementById('add-inventory-form');
  if (addInventoryForm) {
    const username = localStorage.getItem('username');
    if (!username) {
      window.location.href = '/login.html';
      return;
    }
    
    // Set welcome message
    document.getElementById('welcome-message').textContent = `Welcome back, ${username}!`;
    
    // Load initial data
    loadInventory(username);
    initAnalysisFunctionality();
    
    loadCustomerPreferences(username);
    
   // Handle inventory form submission with better debugging
    addInventoryForm.addEventListener('submit', function(e) {
      e.preventDefault();
      
      const data = {
        username: username,
        size: document.getElementById('size').value,
        price: document.getElementById('price').value,  // Changed from color to price
        print: document.getElementById('print').value,
        stock: document.getElementById('stock').value
      };
      
      console.log('Sending inventory data:', data);
      
      // Show loading state
      document.getElementById('loading-inventory').style.display = 'block';
      
      fetch('/inventory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
      .then(response => {
        console.log('Response status:', response.status, response.statusText);
        
        // Check if response is JSON
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
          return response.text().then(text => {
            console.error('Non-JSON response:', text);
            throw new Error('Server returned non-JSON response');
          });
        }
        return response.json();
      })
      .then(data => {
        console.log('Server response:', data);
        if (data.message === 'Inventory added successfully') {
          showNotification('Inventory added successfully');
          addInventoryForm.reset();
          loadInventory(username); // Reload inventory
        } else {
          showNotification('Error: ' + data.message, 'error');
        }
      })
      .catch(err => {
        console.error('Fetch error:', err);
        showNotification('Error: ' + err.message, 'error');
      })
      .finally(() => {
        document.getElementById('loading-inventory').style.display = 'none';
      });
    });
    
    // Handle logout
    document.getElementById('logout-btn')?.addEventListener('click', function(e) {
      e.preventDefault();
      localStorage.removeItem('username');
      window.location.href = '/index.html';
    });
  }
  
  // Check if we're on the customer dashboard page
  const preferencesSection = document.getElementById('preferences-summary');
  if (preferencesSection) {
    const username = localStorage.getItem('username');
    if (!username) {
      window.location.href = '/login.html';
      return;
    }
    
    // Set welcome message
    document.getElementById('welcome-message').textContent = `Welcome back, ${username}!`;
    
    // Load initial data
    loadPreferences(username);
    loadRecommendations(username);
    loadNotifications(username);
    
    // Handle notification clicks
    document.getElementById('notifications-link')?.addEventListener('click', function(e) {
      e.preventDefault();
      document.getElementById('notifications-list').scrollIntoView({ behavior: 'smooth' });
    });
    
    // Handle logout
    document.getElementById('logout-btn')?.addEventListener('click', function(e) {
      e.preventDefault();
      localStorage.removeItem('username');
      window.location.href = '/index.html';
    });
  }
});

// Load inventory data - improved error handling
function loadInventory(username) {
  const loadingElement = document.getElementById('loading-inventory');
  const inventoryList = document.getElementById('inventory-list');
  
  if (!loadingElement || !inventoryList) return;
  
  loadingElement.style.display = 'block';
  inventoryList.innerHTML = '';
  
  console.log(`Fetching inventory for username: ${username}`);
  
  fetch(`/inventory/${encodeURIComponent(username)}`
        ,{cache:'no-store'})
    .then(response => {
      if (!response.ok) {
        return response.text().then(text => {
          console.error('Server returned non-OK response:', response.status, text);
          throw new Error(`Server error: ${response.status}`);
        });
      }
      return response.json();
    })
    .then(data => {
      console.log('Received inventory data:', data);
      
      if (data.length === 0) {
        inventoryList.innerHTML = '<p>No inventory items yet. Add your first item above!</p>';
        return;
      }
      
      let html = '';
      data.forEach(item => {
        html += `
          <div class="inventory-item">
            <div>
              <strong>Size:</strong> ${item.size || 'N/A'} | 
              <strong>Price:</strong> ${item.price ||item.color|| 'N/A'} | 
              <strong>Print:</strong> ${item.print || 'N/A'}
            </div>
            <div>
              <span class="stock-badge">${item.stock || 0} in stock</span>
            </div>
          </div>
        `;
      });
      
      inventoryList.innerHTML = html;
    })
    .catch(err => {
      console.error('Inventory loading error:', err);
      inventoryList.innerHTML = `<p>Error loading inventory: ${err.message}</p>`;
    })
    .finally(() => {
      loadingElement.style.display = 'none';
    });
}

// For customer dashboard - Individual preferences
function loadPreferences(username) {
  const preferencesContainer = document.getElementById('preferences-summary');
  if (!preferencesContainer) return;
  
  fetch(`/preferences/${username}`)
    .then(response => response.json())
    .then(data => {
      console.log("Customer preferences data:", data); // Debug log
      let html = `
        <div class="preferences-card">
          <p><strong>Size:</strong> ${data.tshirt_size || 'Not set'}</p>
          <p><strong>Print Type:</strong> ${data.print_type || 'Not set'}</p>
          <p><strong>Price Range:</strong> ${data.price_range || 'Not set'}</p>
          <p><strong>Location:</strong> ${data.area_name || 'Not set'}, ${data.city || 'Not set'}, ${data.state || 'Not set'}</p>
        </div>
      `;
      
      preferencesContainer.innerHTML = html;
    })
    .catch(err => {
      console.error("Error loading preferences:", err);
      preferencesContainer.innerHTML = `<p>Error loading preferences: ${err.message}</p>`;
    });
}

// For shopkeeper dashboard - Aggregate statistics
function loadCustomerPreferences(username) {
  const preferencesContainer = document.getElementById('customer-preferences');
  if (!preferencesContainer) return;
  
  fetch(`/customer-preferences/${username}`)
    .then(response => response.json())
    .then(data => {
      if (data.length === 0) {
        preferencesContainer.innerHTML = '<p>No customer preference data available yet.</p>';
        return;
      }
      
      let html = '<div class="preference-stats">';
      data.forEach(preference => {
        html += `
          <div class="preference-item">
            <p><strong>Size:</strong> ${preference.tshirt_size || 'Any'}</p>
            <p><strong>Print Type:</strong> ${preference.print_type || 'Any'}</p>
            <p><strong>Price Range:</strong> ${preference.price_range || 'Any'}</p>
            <p><strong>Count:</strong> ${preference.count} customers</p>
          </div>
        `;
      });
      html += '</div>';
      
      preferencesContainer.innerHTML = html;
    })
    .catch(err => {
      preferencesContainer.innerHTML = `<p>Error loading customer preferences: ${err.message}</p>`;
    });
}

// Load recommendations with enhanced stock display
function loadRecommendations(username) {
  const loadingElement = document.getElementById('loading-recommendations');
  const recommendationsContainer = document.getElementById('recommendations-list');
  
  if (!loadingElement || !recommendationsContainer) return;
  
  loadingElement.style.display = 'block';
  recommendationsContainer.innerHTML = '';
  
  fetch(`/recommendations/${username}`)
    .then(response => response.json())
    .then(data => {
      if (data.length === 0) {
        recommendationsContainer.innerHTML = '<p>No matching t-shirts found in your area yet.</p>';
        return;
      }
      
      let html = '';
      data.forEach(item => {
        // Create stock availability message based on stock level
        let stockMessage = '';
        if (item.stock <= 0) {
          stockMessage = '<span class="out-of-stock">Sorry, out of stock</span>';
        } else if (item.stock < 5) {
          stockMessage = `<span class="low-stock">Hurry up, only ${item.stock} left!</span>`;
        } else {
          stockMessage = `<span class="in-stock">${item.stock} available</span>`;
        }
        
        html += `
          <div class="product-card">
            <div class="product-info">
              <h4><a href="#" class="shop-details" data-shop="${item.shop_name || 'Local Shop'}">${item.shop_name || 'Local Shop'}</a></h4>
              <p>
                <strong>Size:</strong> ${item.size} | 
                <strong>Price Range:</strong> ${item.price} | 
                <strong>Print:</strong> ${item.print}
              </p>
              <p><small>Address: ${item.address || 'Local Area'}</small></p>
              <div class="stock-info">
                ${stockMessage}
              </div>
            </div>
          </div>
        `;
      });
      
      recommendationsContainer.innerHTML = html;
      
      // Add event listeners to shop names
      document.querySelectorAll('.shop-details').forEach(link => {
        link.addEventListener('click', function(e) {
          e.preventDefault();
          const shopName = this.getAttribute('data-shop');
          alert(`Shop Details: ${shopName}\nPlease visit this shop for more information about their t-shirt collection.`);
        });
      });
    })
    .catch(err => {
      recommendationsContainer.innerHTML = `<p>Error loading recommendations: ${err.message}</p>`;
    })
    .finally(() => {
      loadingElement.style.display = 'none';
    });
}

// Load notifications with better error handling and matching criteria display
function loadNotifications(username) {
  const loadingElement = document.getElementById('loading-notifications');
  const notificationsContainer = document.getElementById('notifications-list');
  const notificationsBadge = document.getElementById('notifications-badge');
  
  if (!loadingElement || !notificationsContainer) return;
  
  loadingElement.style.display = 'block';
  notificationsContainer.innerHTML = '';
  
  fetch(`/notifications/${username}`)
    .then(response => response.json())
    .then(data => {
      if (data.length === 0) {
        notificationsContainer.innerHTML = '<p>No notifications yet.</p>';
        if (notificationsBadge) notificationsBadge.style.display = 'none';
        return;
      }
      
      // Count unread notifications
      const unreadCount = data.filter(n => !n.seen).length;
      if (notificationsBadge) {
        if (unreadCount > 0) {
          notificationsBadge.textContent = unreadCount;
          notificationsBadge.style.display = 'block';
        } else {
          notificationsBadge.style.display = 'none';
        }
      }
      
      let html = '';
      data.forEach(notification => {
        // Create matched criteria message
        let matchedCriteria = [];
        if (notification.matchedSize) matchedCriteria.push('Size');
        if (notification.matchedPrint) matchedCriteria.push('Print Type');
        
        const matchMessage = matchedCriteria.length > 0 
          ? `<p class="matched-criteria">Matches your ${matchedCriteria.join(' & ')}</p>` 
          : '';
        
        html += `
          <div class="notification-item ${notification.seen ? 'seen' : 'unseen'}">
            <div class="notification-content">
              <p>${notification.message}</p>
              ${matchMessage}
              <p class="notification-meta">
                <small>Shop: ${notification.shop_name || 'Local Shop'}</small>
                <small>Address: ${notification.address || 'Local Area'}</small>
              </p>
            </div>
            ${notification.seen ? '' : '<button class="mark-read-btn" data-id="' + notification.id + '">Mark as read</button>'}
          </div>
        `;
      });
      
      notificationsContainer.innerHTML = html;
      
      // Add event listeners to mark as read buttons
      document.querySelectorAll('.mark-read-btn').forEach(button => {
        button.addEventListener('click', function() {
          const notificationId = this.getAttribute('data-id');
          markNotificationAsRead(notificationId, this.parentElement);
        });
      });
    })
    .catch(err => {
      notificationsContainer.innerHTML = `<p>Error loading notifications: ${err.message}</p>`;
    })
    .finally(() => {
      loadingElement.style.display = 'none';
    });
}

// Mark notification as read
function markNotificationAsRead(id, element) {
  fetch(`/notifications/${id}/read`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' }
  })
  .then(response => response.json())
  .then(data => {
    if (data.message === 'Notification marked as read') {
      // Update UI
      element.classList.remove('unseen');
      element.classList.add('seen');
      element.querySelector('.mark-read-btn')?.remove();
      
      // Update badge count
      const notificationsBadge = document.getElementById('notifications-badge');
      if (notificationsBadge) {
        const currentCount = parseInt(notificationsBadge.textContent) || 0;
        if (currentCount > 1) {
          notificationsBadge.textContent = currentCount - 1;
        } else {
          notificationsBadge.style.display = 'none';
        }
      }
    }
  })
  .catch(err => {
    console.error('Error marking notification as read:', err);
  });
}
// Add this to your JavaScript for rendering the ML clustering results
function renderSegmentationResults(data) {
  // Render cluster visualization
  renderClusterVisualization(data.clusters);
  
  // Render insights
  renderSegmentInsights(data.insights);
  
  // Render elbow curve
  renderElbowCurve(data.elbow_data);
  
  // Render basic stats
  renderBasicStats(data.basic_stats);
}

function renderClusterVisualization(clusters) {
  const container = document.getElementById('cluster-visualization');
  if (!container) return;
  
  // Clear previous visualization
  container.innerHTML = '';
  
  // Set up the D3 visualization
  const margin = {top: 20, right: 20, bottom: 30, left: 40};
  const width = container.clientWidth - margin.left - margin.right;
  const height = 400 - margin.top - margin.bottom;
  
  const svg = d3.select(container).append('svg')
    .attr('width', width + margin.left + margin.right)
    .attr('height', height + margin.top + margin.bottom)
    .append('g')
    .attr('transform', `translate(${margin.left},${margin.top})`);
  
  // Create scales
  const x = d3.scaleLinear()
    .domain(d3.extent(clusters, d => d.pca_x))
    .range([0, width]);
  
  const y = d3.scaleLinear()
    .domain(d3.extent(clusters, d => d.pca_y))
    .range([height, 0]);
  
  // Add X axis
  svg.append('g')
    .attr('transform', `translate(0,${height})`)
    .call(d3.axisBottom(x));
  
  // Add Y axis
  svg.append('g')
    .call(d3.axisLeft(y));
  
  // Add axis labels
  svg.append('text')
    .attr('text-anchor', 'middle')
    .attr('x', width / 2)
    .attr('y', height + margin.bottom)
    .text('Principal Component 1');
  
  svg.append('text')
    .attr('text-anchor', 'middle')
    .attr('transform', 'rotate(-90)')
    .attr('x', -height / 2)
    .attr('y', -margin.left + 10)
    .text('Principal Component 2');
  
  // Add title
  svg.append('text')
    .attr('text-anchor', 'middle')
    .attr('x', width / 2)
    .attr('y', 0)
    .style('font-size', '16px')
    .text('Customer Segments Visualization');
  
  // Color scale
  const color = d3.scaleOrdinal(d3.schemeCategory10);
  
  // Create a tooltip
  const tooltip = d3.select('body').append('div')
    .attr('class', 'segment-tooltip')
    .style('opacity', 0)
    .style('position', 'absolute')
    .style('background-color', 'white')
    .style('border', '1px solid #ddd')
    .style('padding', '10px')
    .style('border-radius', '5px')
    .style('pointer-events', 'none');
  
  // Add dots
  svg.selectAll('dot')
    .data(clusters)
    .enter()
    .append('circle')
      .attr('cx', d => x(d.pca_x))
      .attr('cy', d => y(d.pca_y))
      .attr('r', 5)
      .style('fill', d => color(d.cluster))
      .style('opacity', 0.7)
      .on('mouseover', function(event, d) {
        tooltip.transition()
          .duration(200)
          .style('opacity', .9);
        tooltip.html(`Segment: ${d.segment_name}`)
          .style('left', (event.pageX + 10) + 'px')
          .style('top', (event.pageY - 28) + 'px');
      })
      .on('mouseout', function() {
        tooltip.transition()
          .duration(500)
          .style('opacity', 0);
      });
  
  // Add legend
  const segments = [...new Set(clusters.map(d => d.segment_name))];
  const legendSpace = height / segments.length;
  
  segments.forEach((segment, i) => {
    const cluster = clusters.find(d => d.segment_name === segment).cluster;
    
    svg.append('rect')
      .attr('x', width - 18)
      .attr('y', i * legendSpace)
      .attr('width', 10)
      .attr('height', 10)
      .style('fill', color(cluster));
    
    svg.append('text')
      .attr('x', width - 24)
      .attr('y', i * legendSpace + 9)
      .attr('text-anchor', 'end')
      .style('font-size', '12px')
      .text(segment);
  });
}

function renderSegmentInsights(insights) {
  const container = document.getElementById('insights-list');
  if (!container) return;
  
  let html = '<div class="segment-insights">';
  
  insights.forEach(insight => {
    html += `
      <div class="segment-insight">
        <h5>${insight.title}</h5>
        <p class="segment-characteristics">
          ${insight.characteristics.map(c => `<span class="characteristic">${c}</span>`).join(' • ')}
        </p>
        <div class="segment-recommendation">
          <strong>Recommendation:</strong> ${insight.recommendation}
        </div>
      </div>
    `;
  });
  
  html += '</div>';
  container.innerHTML = html;
}

function renderElbowCurve(elbowData) {
  const container = document.getElementById('elbow-curve');
  if (!container) return;
  
  const ctx = container.getContext('2d');
  
  // Destroy existing chart if any
  if (window.elbowChart) {
    window.elbowChart.destroy();
  }
  
  window.elbowChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: elbowData.cluster_range,
      datasets: [{
        label: 'Sum of Squared Distances',
        data: elbowData.wcss,
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        borderColor: 'rgba(75, 192, 192, 1)',
        borderWidth: 2,
        pointRadius: 4,
        pointBackgroundColor: 'rgba(75, 192, 192, 1)'
      }]
    },
    options: {
      responsive: true,
      plugins: {
        title: {
          display: true,
          text: 'Elbow Method for Optimal K'
        },
        tooltip: {
          mode: 'index',
          intersect: false,
        }
      },
      scales: {
        x: {
          title: {
            display: true,
            text: 'Number of Clusters (k)'
          }
        },
        y: {
          title: {
            display: true,
            text: 'WCSS (Within-Cluster Sum of Squares)'
          },
          beginAtZero: false
        }
      }
    }
  });
}

function renderBasicStats(basicStats) {
  // Render size preferences
  const sizesCtx = document.getElementById('sizes-chart').getContext('2d');
  const sizesData = {
    labels: Object.keys(basicStats.sizes),
    datasets: [{
      label: 'Size Distribution',
      data: Object.values(basicStats.sizes),
      backgroundColor: 'rgba(248, 100, 174, 0.7)',
      borderColor: 'rgba(248, 100, 174, 1)',
      borderWidth: 1
    }]
  };
  
  if (window.sizesChart) {
    window.sizesChart.destroy();
  }
  
  window.sizesChart = new Chart(sizesCtx, {
    type: 'bar',
    data: sizesData,
    options: {
      responsive: true,
      plugins: {
        title: {
          display: true,
          text: 'Size Distribution'
        }
      }
    }
  });
  
  // Render print preferences
  const printsCtx = document.getElementById('prints-chart').getContext('2d');
  const printsData = {
    labels: Object.keys(basicStats.prints),
    datasets: [{
      label: 'Print Type Distribution',
      data: Object.values(basicStats.prints),
      backgroundColor: 'rgba(100, 181, 246, 0.7)',
      borderColor: 'rgba(100, 181, 246, 1)',
      borderWidth: 1
    }]
  };
  
  if (window.printsChart) {
    window.printsChart.destroy();
  }
  
  window.printsChart = new Chart(printsCtx, {
    type: 'bar',
    data: printsData,
    options: {
      responsive: true,
      plugins: {
        title: {
          display: true,
          text: 'Print Type Distribution'
        }
      }
    }
  });
  
  // Render price ranges
  const pricesCtx = document.getElementById('prices-chart').getContext('2d');
  const pricesData = {
    labels: Object.keys(basicStats.price_ranges),
    datasets: [{
      label: 'Price Range Distribution',
      data: Object.values(basicStats.price_ranges),
      backgroundColor: 'rgba(255, 183, 77, 0.7)',
      borderColor: 'rgba(255, 183, 77, 1)',
      borderWidth: 1
    }]
  };
  
  if (window.pricesChart) {
    window.pricesChart.destroy();
  }
  
  window.pricesChart = new Chart(pricesCtx, {
    type: 'bar',
    data: pricesData,
    options: {
      responsive: true,
      plugins: {
        title: {
          display: true,
          text: 'Price Range Distribution'
        }
      }
    }
  });
}

// Update the analysis form handler
function initAnalysisFunctionality() {
  const analysisForm = document.getElementById('analysis-form');
  if (!analysisForm) return;
  
  analysisForm.addEventListener('submit', function(e) {
    e.preventDefault();
    
    const fileInput = document.getElementById('csv-file');
    const file = fileInput.files[0];
    
    if (!file) {
      showNotification('Please select a CSV file', 'error');
      return;
    }
    
    const formData = new FormData();
    formData.append('csvFile', file);
    
    // Show loading state
    document.getElementById('analysis-loading').style.display = 'block';
    document.getElementById('analysis-results').style.display = 'none';
    
    fetch('/analyze-customers', {
      method: 'POST',
      body: formData
    })
    .then(response => {
      if (!response.ok) {
        throw new Error('Server error');
      }
      return response.json();
    })
    .then(data => {
      // Hide loading, show results
      document.getElementById('analysis-loading').style.display = 'none';
      document.getElementById('analysis-results').style.display = 'block';
      
      // Render K-means segmentation results
      renderSegmentationResults(data);
    })
    .catch(err => {
      document.getElementById('analysis-loading').style.display = 'none';
      showNotification('Error analyzing data: ' + err.message, 'error');
    });
  });
}