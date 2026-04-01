const db = require("../models");
const User = db.users;
const Op = db.Sequelize.Op;
const bcrypt = require('bcryptjs');
const saltRounds = 10; // Number of salt rounds for bcrypt

// Create and Save a new User
exports.create = async (req, res) => {
  // Log request origin/IP (super useful for CORS debugging)
  console.log("📥 Incoming request to /auth/create");
  console.log("➡️ Origin:", req.headers.origin);
  console.log("➡️ IP:", req.ip);

  // Log incoming body (hide password)
  console.log("➡️ Body received:", {
    username: req.body.username,
    email: req.body.email,
    phone: req.body.phone,
    full_name: req.body.full_name,
    password: req.body.password ? "***HIDDEN***" : null
  });

  // Basic validation
  if (!req.body.username || !req.body.password) {
    console.log("❌ Validation failed — missing username or password");
    return res.status(400).send({ message: "Content can not be empty!" });
  }

  try {
    // Hash password
    const hashedPassword = await bcrypt.hash(req.body.password, saltRounds);
    console.log("🔐 Password hashed successfully");

    // User object
    const user = {
      username: req.body.username,
      email: req.body.email,
      phone: req.body.phone,
      full_name: req.body.full_name,
      role: 'director',
      password: hashedPassword
    };

    console.log("📝 User object prepared:", {
      ...user,
      password: "***HASHED***"
    });

    // Save to DB
    const data = await User.create(user);

    console.log("✅ User created successfully:", {
      id: data.id,
      username: data.username,
      role: data.role
    });

    res.send(data);

  } catch (err) {
    console.error("🔥 Error during user creation:", err.stack || err.message);

    res.status(500).send({
      message: err.message || "Some error occurred while creating the User."
    });
  }
};


exports.findAll = async (req, res) => {
  try {
    const users = await User.findAll({
      order: [['id', 'DESC']]
    });

    // Manually resolve supervisor data from supervisor_id arrays
    const userMap = {};
    for (const u of users) {
      userMap[u.id] = { id: u.id, full_name: u.full_name, role: u.role };
    }

    const usersWithSupervisors = users.map(u => {
      const userData = u.toJSON();
      if (Array.isArray(userData.supervisor_id) && userData.supervisor_id.length > 0) {
        userData.supervisors = userData.supervisor_id
          .map(sid => userMap[sid])
          .filter(Boolean);
      } else {
        userData.supervisors = [];
      }
      return userData;
    });

    res.json({
      success: true,
      data: usersWithSupervisors
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching users",
      error: error.message
    });
  }
};
// Find a single User with an id
exports.findOne = (req, res) => {
  const id = req.params.id;

  User.findByPk(id)
    .then(data => {
      if (data) {
        res.send(data);
      } else {
        res.status(404).send({
          message: `Cannot find User with id=${id}.`
        });
      }
    })
    .catch(err => {
      res.status(500).send({
        message: "Error retrieving User with id=" + id
      });
    });
};

// Update a User by the id in the request
exports.update = async (req, res) => {
  const id = req.params.id;

  // Prepare the data for updating - include ALL fields
  const updateData = {
    full_name: req.body.full_name,
    phone: req.body.phone,
    role: req.body.role,
    supervisor_id: req.body.supervisor_id !== undefined ? req.body.supervisor_id : null,
    end_date: req.body.end_date ? req.body.end_date : null,
    is_active: req.body.is_active !== undefined ? req.body.is_active : true
  };

  // Remove undefined fields
  Object.keys(updateData).forEach(key => {
    if (updateData[key] === undefined) {
      delete updateData[key];
    }
  });

  try {
    // Check if the user exists before updating
    const existingUser = await User.findByPk(id);
    if (!existingUser) {
      return res.status(404).json({
        success: false,
        message: `User with id=${id} not found.`
      });
    }

    console.log("Existing user data:", existingUser);
    console.log("Incoming request data:", req.body);
    console.log("Prepared update data:", updateData);

    // Check if password is provided and needs updating
    if (req.body.password && req.body.password.trim() !== '') {
      // Hash the password before updating
      const hashedPassword = await bcrypt.hash(req.body.password, 10);
      updateData.password = hashedPassword;
    }

    // Update the user
    const [num] = await User.update(updateData, { where: { id: id } });

    console.log('Number of affected rows:', num);

    if (num === 0) {
      return res.status(400).json({
        success: false,
        message: "No changes were made. The data might already be the same."
      });
    }

    // Fetch the updated user data
    const updatedUser = await User.findByPk(id, {
      attributes: { exclude: ['password'] } // Exclude password from response
    });

    // Return the response with the updated user data
    res.json({
      success: true,
      message: "User was updated successfully.",
      data: updatedUser,
    });
  } catch (err) {
    console.error("Error updating user:", err);

    // Return a structured error response
    res.status(500).json({
      success: false,
      message: `Error updating User with id=${id}`,
      error: err.message,
    });
  }
};

// Delete a User with the specified id in the request
exports.delete = (req, res) => {
  const id = req.params.id;

  User.destroy({
    where: { id: id }
  })
    .then(num => {
      if (num == 1) {
        res.send({
          message: "User was deleted successfully!"
        });
      } else {
        res.send({
          message: `Cannot delete User with id=${id}. Maybe User was not found!`
        });
      }
    })
    .catch(err => {
      res.status(500).send({
        message: "Could not delete User with id=" + id
      });
    });
};

// Delete all User from the database.
exports.deleteAll = (req, res) => {
  User.destroy({
    where: {},
    truncate: false
  })
    .then(nums => {
      res.send({ message: `${nums} User were deleted successfully!` });
    })
    .catch(err => {
      res.status(500).send({
        message:
          err.message || "Some error occurred while removing all User."
      });
    });
};

// find all published User
exports.findAllPublished = (req, res) => {
  User.findAll({ where: { published: true } })
    .then(data => {
      res.send(data);
    })
    .catch(err => {
      res.status(500).send({
        message:
          err.message || "Some error occurred while retrieving User."
      });
    });
};
