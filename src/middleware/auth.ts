import { NextFunction, Request, Response } from "express";
import jwt, { JwtPayload, Secret } from "jsonwebtoken";

export interface IJwtPayload extends JwtPayload {
  _id: string;
  email: string;
  role: string;
}
export interface AuthRequest extends Request {
  user?: IJwtPayload;
}

export const auth = (req: AuthRequest, res: Response, next: NextFunction) => {
  const token = req.header("x-auth-token");
  if (!token) {
    res
      .status(401)
      .json({ success: false, message: "Access denied. No token provided." });
    return;
  }

  try {
    const JWT_SECRET = process.env.jwtPrivateKey!;
    const decoded = jwt.verify(token, JWT_SECRET) as IJwtPayload;

    req.user = decoded;
    next();
  } catch (err: any) {
    res.status(401).json({ success: false, message: "Invalid token." });
  }
};
