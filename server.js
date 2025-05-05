const express = require('express');
const path = require('path');
const mysql = require('mysql2');
const app = express();
const PORT = 3000;
const multer = require('multer');
const csv = require('csv-parser');
const fs = require('fs');
const { PythonShell } = require('python-shell');

// Serve static files from the current directory
app.use(express.static(path.join(__dirname, 'public')));

// Body parser middleware - IMPORTANT: Place these BEFORE your routes
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Debug middleware for logging request bodies
app.use((req, res, next) => {
  if (req.method === 'POST') {
    console.log('Request URL:', req.url);
    console.log('Request Body:', req.body);
  }
  next();
});

// MySQL connection
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'Mysql1419!',
  database: 'custox'
});

db.connect(err => {
  if (err) {
    console.error('Database connection failed:', err.stack);
    return;
  }
  console.log('Connected to database.');
});

// Serve index.html at the root URL
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname,'public', 'index.html'));
});

// Signup route
app.post('/signup', (req, res) => {
  const { username, password, role } = req.body;

  if (!username || !password || !role) {
    return res.status(400).json({ message: 'Missing fields' });
  }

  // Insert into the users table
  const query = `INSERT INTO users (username, password, role) VALUES (?, ?, ?)`;

  db.query(query, [username, password, role], (err, results) => {
    if (err) {
      console.error('Signup error:', err.sqlMessage || err.message);
      return res.status(500).json({ message: 'Signup failed', error: err.sqlMessage || err.message });
    }
    return res.json({ message: 'Signup successful', role });
  });
});

// Login route - keep only one version of this
app.post('/login', (req, res) => {
  const { username, password } = req.body;

  // Query user table for authentication
  const query = 'SELECT * FROM users WHERE username = ? AND password = ?';

  db.query(query, [username, password], (err, userResults) => {
    if (err) {
      console.error('Login error:', err);
      return res.status(500).json({ message: 'Database error' });
    }

    if (userResults.length === 0) {
      // no user found
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const user = userResults[0];

    // If user is customer, check if profile exists in customer_profiles table
    if (user.role === 'customer') {
      const checkProfileQuery = 'SELECT username FROM customer_profiles WHERE username = ?';
      db.query(checkProfileQuery, [username], (err2, profileResults) => {
        if (err2) {
          console.error('Profile check error:', err2);
          return res.status(500).json({ message: 'Database error' });
        }

        const profileComplete = profileResults.length > 0;
        return res.json({
          message: 'Login successful',
          role: user.role,
          profileComplete: profileComplete
        });
      });
    }
    // If user is shopkeeper, check if profile exists in shopkeeper_profiles table
    else if (user.role === 'shopkeeper') {
      const checkShopkeeperProfileQuery = 'SELECT username FROM shopkeeper_profiles WHERE username = ?';
      db.query(checkShopkeeperProfileQuery, [username], (err2, profileResults) => {
        if (err2) {
          console.error('Shopkeeper profile check error:', err2);
          return res.status(500).json({ message: 'Database error' });
        }
        
        const profileComplete = profileResults.length > 0;
        return res.json({
          message: 'Login successful',
          role: user.role,
          profileComplete: profileComplete
        });
      });
    } 
    else {
      // For other roles, return login success directly
      return res.json({
        message: 'Login successful',
        role: user.role,
        profileComplete: true // irrelevant for non-customers
      });
    }
  });
});

// Endpoint to save customer questions
app.post('/customer-questions', (req, res) => {
  const {
    username,
    phone,
    age,
    gender,
    areaName,
    pincode,
    city,
    state,
    tshirtSize,
    printType,
    priceRange
  } = req.body;

  // Basic validation
  if (!username || !phone || !age || !areaName || !pincode || !city || !state || !tshirtSize || !printType || !priceRange) {
    return res.status(400).json({ message: 'Please fill all the required fields.' });
  }

  // Insert or update customer profile in DB
  const query = `
    INSERT INTO customer_profiles
      (username, phone, age, gender, area_name, pincode, city, state, tshirt_size, print_type, price_range)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE
      phone = VALUES(phone),
      age = VALUES(age),
      gender = VALUES(gender),
      area_name = VALUES(area_name),
      pincode = VALUES(pincode),
      city = VALUES(city),
      state = VALUES(state),
      tshirt_size = VALUES(tshirt_size),
      print_type = VALUES(print_type),
      price_range = VALUES(price_range);
  `;

  db.query(query, [
    username,
    phone,
    age,
    gender,
    areaName,
    pincode,
    city,
    state,
    tshirtSize,
    printType,
    priceRange
  ], (err, results) => {
    if (err) {
      console.error('Error saving customer profile:', err.sqlMessage || err.message);
      return res.status(500).json({ message: 'Failed to save profile data.' });
    }

    return res.json({ message: 'Questions submitted successfully' });
  });
});

// Updated shopkeeper questions endpoint
app.post('/shopkeeper-questions', (req, res) => {
  const { username, areaName, city, state, pincode, products } = req.body;

  if (!username || !areaName || !city || !state || !pincode || !products) {
    return res.status(400).json({ message: 'Please fill all the required fields.' });
  }

  // First check if this shopkeeper exists in the users table
  const checkUserQuery = 'SELECT * FROM users WHERE username = ? AND role = "shopkeeper"';
  
  db.query(checkUserQuery, [username], (err, userResults) => {
    if (err) {
      console.error('Error checking user:', err);
      return res.status(500).json({ message: 'Database error' });
    }
    
    if (userResults.length === 0) {
      return res.status(404).json({ message: 'Shopkeeper not found' });
    }
    
    // Create the address from the components
    const address = `${areaName}, ${city}, ${state}, ${pincode}`;
    
    // Now insert or update the shopkeeper profile using the correct columns from your table
    const query = `
      INSERT INTO shopkeeper_profiles
        (username, shop_name, address, profile_complete, email)
      VALUES (?, ?, ?, 1, ?)
      ON DUPLICATE KEY UPDATE
        shop_name = VALUES(shop_name),
        address = VALUES(address),
        profile_complete = 1
    `;
    
    db.query(query, [username, products, address, username], (err) => {
      if (err) {
        console.error('Error saving shopkeeper profile:', err);
        return res.status(500).json({ message: 'Failed to save profile data.' });
      }
      
      return res.json({ message: 'Answers submitted successfully' });
    });
  });
});



// ADD NEW ENDPOINT: Get shopkeeper's inventory
app.get('/inventory/:username', (req, res) => {
  const username = req.params.username;
  
  console.log(`Fetching inventory for: ${username}`);
  
  const query = `
    SELECT i.*
    FROM inventory i
    JOIN shopkeepers s ON i.shopkeeper_id = s.id
    WHERE s.email = ?
  `;
  
  db.query(query, [username], (err, results) => {
    if (err) {
      console.error('Error fetching inventory:', err);
      return res.status(500).json({ message: 'Database error' });
    }
    
    console.log(`Found ${results.length} inventory items`);
    res.json(results);
  });
});


// Add notification creation function
function createNotification(username, inventoryId, message) {
  const query = `
    INSERT INTO notifications (username, inventory_id, message, seen, created_at)
    VALUES (?, ?, ?, 0, NOW())
  `;
  
  db.query(query, [username, inventoryId, message], (err, results) => {
    if (err) {
      console.error('Error creating notification:', err);
    } else {
      console.log(`Notification created for user ${username}`);
    }
  });
}
// CORRECTED: Get customer preferences aggregated statistics (for shopkeepers)
app.get('/customer-preferences/:username', (req, res) => {
  const username = req.params.username;
  
  // Simplified query - fetch aggregated statistics
  const query = `
    SELECT tshirt_size, print_type, price_range, COUNT(*) as count
    FROM customer_profiles
    GROUP BY tshirt_size, print_type, price_range
    LIMIT 5
  `;
  
  db.query(query, (err, results) => {
    if (err) {
      console.error('Error fetching preferences:', err);
      return res.status(500).json({ message: 'Database error' });
    }
    
    // Return all results as an array
    res.json(results || []);
  });
});
// NEW ENDPOINT: Get individual customer preferences (for customer dashboard)
app.get('/preferences/:username', (req, res) => {
  const username = req.params.username;

  const query = `
    SELECT * FROM customer_profiles
    WHERE username = ?
  `;

  db.query(query, [username], (err, results) => {
    if (err) {
      console.error('Error fetching preferences:', err);
      return res.status(500).json({ message: 'Database error' });
    }

    if (results.length === 0) {
      // Return empty object with default values if no profile is found
      return res.json({
        tshirt_size: 'Not set',
        print_type: 'Not set',
        price_range: 'Not set',
        area_name: 'Not set',
        city: 'Not set',
        state: 'Not set'
      });
    }

    // Return the first result
    res.json(results[0]);
  });
});

// Get recommendations for a customer
app.get('/recommendations/:username', (req, res) => {
  const username = req.params.username;

  // First get the customer's preferences
  const getPreferencesQuery = `
    SELECT tshirt_size, print_type, price_range, area_name, city, state
    FROM customer_profiles
    WHERE username = ?
  `;

  db.query(getPreferencesQuery, [username], (err, preferences) => {
    if (err) {
      console.error('Error fetching preferences:', err);
      return res.status(500).json({ message: 'Database error' });
    }

    if (preferences.length === 0) {
      return res.json([]); // Return empty array if no preferences
    }

    const preference = preferences[0];

    // Now get matching inventory items based on preferences
    const getRecommendationsQuery = `
      SELECT i.*, s.email as shop_email, sp.shop_name, sp.address
      FROM inventory i
      JOIN shopkeepers s ON i.shopkeeper_id = s.id
      JOIN shopkeeper_profiles sp ON s.email = sp.username
      WHERE (i.size = ? OR i.print = ?)
      AND i.stock > 0
    `;

    db.query(getRecommendationsQuery, [
      preference.tshirt_size, 
      preference.print_type
    ], (err, results) => {
      if (err) {
        console.error('Error fetching recommendations:', err);
        return res.status(500).json({ message: 'Database error' });
      }

      // Always return an array, even if empty
      return res.json(results || []);
    });
  });
});
// Get notifications for a customer
app.get('/notifications/:username', (req, res) => {
  const username = req.params.username;

  const query = `
    SELECT n.*, i.size, i.price, i.print, i.stock, 
           s.email as shop_email, sp.shop_name, sp.address,
           cp.tshirt_size, cp.print_type
    FROM notifications n
    JOIN inventory i ON n.inventory_id = i.id
    JOIN shopkeepers s ON i.shopkeeper_id = s.id
    JOIN shopkeeper_profiles sp ON s.email = sp.username
    JOIN customer_profiles cp ON n.username = cp.username
    WHERE n.username = ?
    ORDER BY n.created_at DESC
  `;

  db.query(query, [username], (err, results) => {
    if (err) {
      console.error('Error fetching notifications:', err);
      return res.status(500).json({ message: 'Database error' });
    }

    // Add matched criteria flags to each notification
    const enhancedResults = results.map(notification => {
      return {
        ...notification,
        matchedSize: notification.size === notification.tshirt_size,
        matchedPrint: notification.print === notification.print_type,
        seen: notification.seen || 0 // Ensure seen property exists
      };
    });

    // Always return an array, even if empty
    return res.json(enhancedResults || []);
  });
});
// Add this notification creation function to your server.js
function createNotification(username, inventoryId, shopName, message) {
  const query = `
    INSERT INTO notifications (username, inventory_id, message, seen, created_at)
    VALUES (?, ?, ?, 0, NOW())
  `;
  
  db.query(query, [username, inventoryId, message], (err, results) => {
    if (err) {
      console.error('Error creating notification:', err);
    } else {
      console.log(`Notification created for user ${username}`);
    }
  });
}

// -----------------------------
// POST /inventory — add new item
// -----------------------------
app.post('/inventory', (req, res) => {
  console.log('Received inventory request:', req.body);

  const { username, size, price, print, stock } = req.body;
  if (!username || !size || !price || !print || !stock) {
    console.log('Missing fields in request:', { username, size, price, print, stock });
    return res.status(400).json({ message: 'All fields are required' });
  }

  // 1) Verify this user is a shopkeeper
  const getShopkeeperQuery = `
    SELECT id 
    FROM users 
    WHERE username = ? AND role = 'shopkeeper'
  `;
  db.query(getShopkeeperQuery, [username], (err, results) => {
    if (err) {
      console.error('Error finding shopkeeper:', err);
      return res.status(500).json({ message: 'Internal server error' });
    }
    if (results.length === 0) {
      return res.status(403).json({ message: 'Unauthorized: Not a shopkeeper' });
    }
    const shopkeeperId = results[0].id;

    // 2) Insert the inventory row
    const insertInventory = `
      INSERT INTO inventory (shopkeeper_id, size, price, print, stock)
      VALUES (?, ?, ?, ?, ?)
    `;
    db.query(
      insertInventory,
      [shopkeeperId, size, price, print, stock],
      (err, insertResult) => {
        if (err) {
          console.error('Error adding inventory:', err);
          return res.status(500).json({ message: 'Error adding inventory' });
        }
        const inventoryId = insertResult.insertId;
        console.log('Added inventory ID:', inventoryId);

        // 3) Notify matching customers
        notifyMatchingCustomers(username, inventoryId, size, print)
          .then(() => {
            res.status(200).json({ message: 'Inventory added successfully' });
          })
          .catch(notificationErr => {
            console.error('Notification error:', notificationErr);
            // Still return success for the add
            res.status(200).json({ message: 'Inventory added, but notifications failed' });
          });
      }
    );
  });
});

// -----------------------------
// Helper: find & notify customers
// -----------------------------
function notifyMatchingCustomers(shopkeeperUsername, inventoryId, size, print) {
  return new Promise((resolve, reject) => {
    // Get the shop name for the notification
    const shopInfoQuery = `
      SELECT shop_name 
      FROM shopkeeper_profiles 
      WHERE username = ?
    `;
    db.query(shopInfoQuery, [shopkeeperUsername], (err, shopRows) => {
      if (err) return reject(err);
      const shopName = shopRows[0]?.shop_name || 'A local shop';

      // Find all customers whose preferences match size or print
      const findCustQuery = `
        SELECT username 
        FROM customer_profiles
        WHERE tshirt_size = ? OR print_type = ?
      `;
      db.query(findCustQuery, [size, print], (err, custRows) => {
        if (err) return reject(err);
        
        // Insert one notification per matching customer
        const insertNotif = `
          INSERT INTO notifications (username, inventory_id, message, seen, created_at)
          VALUES (?, ?, ?, 0, NOW())
        `;
        let pending = custRows.length;
        if (pending === 0) return resolve();

        custRows.forEach(({ username: customerUsername }) => {
          const message = `New t-shirt available at ${shopName} matching your preferences!`;
          db.query(insertNotif, [customerUsername, inventoryId, message], err => {
            if (err) console.error('Notification insert error:', err);
            if (--pending === 0) resolve();
          });
        });
      });
    });
  });
}

// -----------------------------
// GET /inventory/:username — list items
// -----------------------------
app.get('/inventory/:username', (req, res) => {
  const username = req.params.username;
  console.log(`Fetching inventory for: ${username}`);

  // 1) Verify shopkeeper
  const getShopkeeperQuery = `
    SELECT id 
    FROM users 
    WHERE username = ? AND role = 'shopkeeper'
  `;
  db.query(getShopkeeperQuery, [username], (err, results) => {
    if (err) {
      console.error('Error finding shopkeeper:', err);
      return res.status(500).json({ message: 'Internal server error' });
    }
    if (results.length === 0) {
      return res.status(404).json({ message: 'Shopkeeper not found' });
    }
    const shopkeeperId = results[0].id;

    // 2) Fetch inventory rows
    const getInvQuery = `
      SELECT * 
      FROM inventory 
      WHERE shopkeeper_id = ?
    `;
    db.query(getInvQuery, [shopkeeperId], (err, items) => {
      if (err) {
        console.error('Error fetching inventory:', err);
        return res.status(500).json({ message: 'Database error fetching inventory' });
      }
      res.set('Cache-Control', 'no-store, max-age=0');
      // Always return JSON
      res.status(200).json(items);
    });
  });
});


// Configure file upload
const upload = multer({ 
  dest: 'uploads/',
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
  fileFilter: (req, file, cb) => {
    if (file.mimetype !== 'text/csv' && file.originalname.split('.').pop() !== 'csv') {
      return cb(new Error('Only CSV files are allowed'));
    }
    cb(null, true);
  }
});

// Add the analysis endpoint with K-means clustering
app.post('/analyze-customers', upload.single('csvFile'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No file uploaded' });
  }
  
  const results = [];
  
  fs.createReadStream(req.file.path)
    .pipe(csv())
    .on('data', (data) => results.push(data))
    .on('end', () => {
      // Delete file after processing
      fs.unlinkSync(req.file.path);
      
      // Process the data
      if (results.length === 0) {
        return res.status(400).json({ message: 'CSV file is empty' });
      }
      
      try {
        // Prepare data for ML processing
        const processedData = preprocessData(results);

        const scriptPath = path.join(__dirname, 'scripts');
        console.log('Script path:', scriptPath);
        console.log('Script exists:', fs.existsSync(path.join(scriptPath, 'segmentation.py')));
        // Call Python script for K-means clustering
        let options = {
          mode: 'text',
          pythonPath: 'python', // or 'python3' depending on your environment
          pythonOptions: ['-u'], // unbuffered
          scriptPath: path.join(__dirname, 'scripts')
        };
        
        let pyshell = new PythonShell('segmentation.py', options);
        
        // Send data to Python script
        pyshell.send(JSON.stringify(processedData));
        
        let mlResult = '';
        pyshell.on('message', function (message) {
          mlResult += message;
        });
        pyshell.on('stderr', function(stderr) {
          console.error('Python stderr:', stderr);
        });
        
        pyshell.end(function (err) {
          if (err) {
            console.error('Python script error:', err);
            return res.status(500).json({ message: 'Error in ML processing: ' + err.message });
          }
          
          try {
            // Parse the ML results
            const analysis = JSON.parse(mlResult);
            
            // Add basic statistics from original function
            const basicStats = calculateBasicStats(results);
            
            // Combine ML and basic results
            const combinedAnalysis = {
              ...analysis,
              basic_stats: basicStats
            };
            
            res.json(combinedAnalysis);
          } catch (parseError) {
            console.error('Error parsing ML results:', parseError);
            console.error('ML output:', mlResult);
            res.status(500).json({ message: 'Error parsing ML results: ' + parseError.message });
          }
        });
      } catch (error) {
        console.error('Analysis error:', error);
        res.status(500).json({ message: 'Error analyzing data: ' + error.message });
      }
    })
    .on('error', (error) => {
      console.error('CSV parsing error:', error);
      res.status(500).json({ message: 'Error parsing CSV: ' + error.message });
    });
});

// Helper function to preprocess data
function preprocessData(data) {
  return data.map(row => {
    const processed = {};
    
    // Extract customer ID
    processed.customer_id = row.customer_id || row.id || `customer-${Math.random().toString(36).substring(2, 10)}`;
    
    // Extract numeric fields like price, quantity, etc.
    for (const [key, value] of Object.entries(row)) {
      // Try to convert to number if possible
      const numValue = Number(value);
      if (!isNaN(numValue) && value !== '') {
        processed[key] = numValue;
      } else {
        processed[key] = value;
      }
    }
    
    // Calculate derived fields
    if (row.purchases) {
      processed.frequency = Number(row.purchases);
    }
    
    if (row.total_spent || row.totalSpent || row.amount) {
      processed.totalSpent = Number(row.total_spent || row.totalSpent || row.amount || 0);
    }
    
    if (row.last_purchase_date || row.lastPurchase) {
      processed.last_purchase_date = row.last_purchase_date || row.lastPurchase;
    }
    
    return processed;
  });
}

// Helper function to calculate basic stats
function calculateBasicStats(data) {
  const sizeCount = {};
  const printCount = {};
  const priceRanges = {
    'Under 400': 0,
    '400-600': 0,
    '600-800': 0,
    '800-1000': 0,
    'Above 1000': 0
  };
  
  data.forEach(row => {
    // Count sizes
    const size = row.size || row.tshirt_size || 'Unknown';
    sizeCount[size] = (sizeCount[size] || 0) + 1;
    
    // Count print types
    const print = row.print_type || row.print || 'Unknown';
    printCount[print] = (printCount[print] || 0) + 1;
    
    // Count price ranges
    const price = parseFloat(row.price || row.amount || 0);
    if (price < 400) priceRanges['Under 400']++;
    else if (price < 600) priceRanges['400-600']++;
    else if (price < 800) priceRanges['600-800']++;
    else if (price < 1000) priceRanges['800-1000']++;
    else priceRanges['Above 1000']++;
  });
  
  return {
    sizes: sizeCount,
    prints: printCount,
    price_ranges: priceRanges
  };
}
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}/`);
});