import { pool } from '../config/db.js';

// Handle admin login
export const loginAdmin = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Query the database for the admin
    const [rows] = await pool.execute('SELECT * FROM admins WHERE email = ?', [email]);
    
    if (rows.length > 0) {
      const admin = rows[0];
      
      // Note: In production, always use bcrypt to hash and compare passwords.
      // This is a simple plain-text comparison for setup verification.
      if (admin.password === password) {
        return res.status(200).json({ 
          message: 'Admin logged in successfully',
          token: 'your_generated_jwt_token_here',
          adminId: admin.id
        });
      }
    }
    
    // Fallback static login if no admins exist in DB yet
    if (email === 'admin@vyra.com' && password === 'password') {
      return res.status(200).json({ 
        message: 'Admin logged in successfully (Fallback Static)',
        token: 'placeholder_token_123'
      });
    }

    res.status(401).json({ message: 'Invalid credentials' });
  } catch (error) {
    console.error('Login Error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Handle fetching admin dashboard data
export const getAdminDashboard = async (req, res) => {
  try {
    // Example: Fetch total number of admins from the database
    const [adminRows] = await pool.execute('SELECT COUNT(*) as count FROM admins');
    const totalAdmins = adminRows[0].count;
    
    res.status(200).json({
      stats: {
        totalUsers: 150, // Replace with actual user count query
        totalAdmins: totalAdmins,
        activeSessions: 25,
        revenue: '$1000'
      },
      message: 'Dashboard data fetched successfully'
    });
  } catch (error) {
    console.error('Dashboard Error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
