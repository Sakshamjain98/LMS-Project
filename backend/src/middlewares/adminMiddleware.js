export const isAdmin = (req, res, next) => {
    try {
      if (req.user.role !== "admin") {
        return res.status(403).json({
          success: false,
          message: "Access denied. Admin only.",
        });
      }
      next();
    } catch (error) {
      res.status(500).json({ message: "Authorization error" });
    }
  };
  