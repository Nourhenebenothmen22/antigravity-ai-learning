import { body } from "express-validator";
export const registerValidation=[
    body("name")
    .notEmpty().withMessage("Name is required")
    .isLength({min:3}).withMessage("Name must be at least 3 characters long")
    .isLength({max:30}).withMessage("Name must be at most 30 characters long"),
    body("email")
    .notEmpty().withMessage("Email is required")
    .isEmail().withMessage("Email is invalid"),
    body("password")
    .notEmpty().withMessage("Password is required")
    .isLength({ min: 8 }).withMessage("Password must be at least 8 characters long")
    .isLength({ max: 30 }).withMessage("Password must be at most 30 characters long")
    .matches(/[A-Z]/).withMessage("Password must contain at least one uppercase letter")
    .matches(/[a-z]/).withMessage("Password must contain at least one lowercase letter")
    .matches(/\d/).withMessage("Password must contain at least one number")
    .matches(/[@$!%*?&]/).withMessage("Password must contain at least one special character (@$!%*?&)"),
    body("profileImage")
  .optional()
  .custom((value, { req }) => {
    if (!req.file) return true; 
    const allowedTypes = ["image/jpeg", "image/png"];
    if (!allowedTypes.includes(req.file.mimetype)) {
      throw new Error("Profile image must be JPG or PNG");
    }
    return true;
  })

]