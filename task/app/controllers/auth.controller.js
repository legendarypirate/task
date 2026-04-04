const db = require("../models");
const User = db.users;
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET || "your-fallback-secret-key";

function normalizeIntIdList(value) {
  if (value === undefined || value === null || value === "") return [];
  const raw = Array.isArray(value) ? value : [value];
  return [...new Set(raw.map((v) => Number(v)).filter((n) => Number.isFinite(n)))];
}

// ====================
// REGISTER
// ====================
exports.register = async (req, res) => {
  try {
    const { phone, password, full_name, role, supervisor_id, supervisor_ids, is_active } = req.body;

    if (!phone || !password || !full_name) {
      return res.status(400).json({ message: "Бүх талбаруудыг бөглөнө үү" });
    }

    // Validate phone number format (Mongolian)
    const phoneRegex = /^[89]\d{7}$/;
    if (!phoneRegex.test(phone)) {
      return res.status(400).json({ message: "Утасны дугаар буруу форматтай байна" });
    }

    // Validate password strength
    if (password.length < 6) {
      return res.status(400).json({ message: "Нууц үг хамгийн багадаа 6 тэмдэгтээс бүрдэх ёстой" });
    }

    const existingUser = await User.findOne({ where: { phone } });
    if (existingUser) {
      return res.status(409).json({ message: "Утасны дугаар бүртгэлтэй байна" });
    }

    // Only allow specific roles; default to worker
    const allowedRoles = ["director", "general_manager", "supervisor", "worker"];
    const userRole = allowedRoles.includes(role) ? role : "worker";

    const hashedPassword = await bcrypt.hash(password, 10);

    const supervisorIdList = [
      ...normalizeIntIdList(supervisor_id),
      ...normalizeIntIdList(supervisor_ids),
    ];
    const uniqueSupervisorIds = [...new Set(supervisorIdList)];

    const user = await User.create({
      phone,
      password: hashedPassword,
      full_name,
      role: userRole,
      supervisor_id: uniqueSupervisorIds.length > 0 ? uniqueSupervisorIds : [],
      ...(typeof is_active === "boolean" ? { is_active } : {}),
    });

    // Remove password from response
    const userResponse = { ...user.toJSON() };
    delete userResponse.password;

    res.status(201).json({ 
      message: "Бүртгэл амжилттай", 
      user: userResponse 
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Серверийн алдаа" });
  }
};

// ====================
// LOGIN
// ====================
exports.login = async (req, res) => {
  try {
    console.log('Login attempt with:', { phone: req.body.phone });
    
    const { phone, password } = req.body;

    if (!phone || !password) {
      console.log('Missing phone or password');
      return res.status(400).json({ message: "Утасны дугаар болон нууц үг оруулна уу" });
    }

    // Find user by phone
    console.log('Searching for user with phone:', phone);
    const user = await User.findOne({ where: { phone } });
    
    if (!user) {
      console.log('User not found with phone:', phone);
      return res.status(401).json({ message: "Утасны дугаар эсвэл нууц үг буруу байна" });
    }

    console.log('User found:', { 
      id: user.id, 
      phone: user.phone, 
      is_active: user.is_active 
    });

    // Check if user is active - FIXED: use is_active instead of status
    if (!user.is_active) {
      console.log('User is inactive');
      return res.status(403).json({ message: "Таны бүртгэл идэвхгүй байна" });
    }

    // Verify password
    console.log('Verifying password...');
    const isPasswordValid = await bcrypt.compare(password, user.password);
    console.log('Password valid:', isPasswordValid);

    if (!isPasswordValid) {
      console.log('Invalid password');
      return res.status(401).json({ message: "Утасны дугаар эсвэл нууц үг буруу байна" });
    }

    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: user.id,
        phone: user.phone,
        role: user.role 
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Remove password from user data
    const userResponse = { ...user.toJSON() };
    delete userResponse.password;

    console.log('Login successful for user:', user.id);
    
    res.json({
      message: "Амжилттай нэвтэрлээ",
      token,
      user: userResponse
    });

  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: "Нэвтрэхэд алдаа гарлаа" });
  }
};
// ====================
// VERIFY TOKEN MIDDLEWARE
// ====================
exports.verifyToken = (req, res, next) => {
  const token = req.headers["authorization"]?.split(" ")[1];
  if (!token) return res.status(401).json({ message: "Токен шаардлагатай" });

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) return res.status(403).json({ message: "Токен хүчинтэй биш байна" });
    req.user = decoded;
    next();
  });
};