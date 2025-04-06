import { NextFunction, Request, Response } from "express";
import jwt, { JwtPayload, Secret } from "jsonwebtoken";

interface IAuthRequest extends Request {
  user?: JwtPayload;
}
interface IJwtPayload extends JwtPayload {
  id: string;
  email: string;
  role: string;
}

export const auth = (req: IAuthRequest, res: Response, next: NextFunction) => {
  const token = req.header("x-auth-token");
  if (!token)
    return res
      .status(401)
      .json({ success: false, message: "Access denied. No token provided." });

  try {
    const JWT_SECRET = process.env.jwtPrivateKey!;
    const decoded = jwt.verify(token, JWT_SECRET) as IJwtPayload;

    console.log("decoded");
    req.user = decoded;
    next();
  } catch (err: any) {
    res.status(400).json({ success: false, message: "Invalid token." });
  }
};
