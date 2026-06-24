import { Request, Response, NextFunction } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";

interface IUser extends Document {
  _id: string;
  name: string;
  email: string;
}

export interface AuthenticatedRequest extends Request {
  user?: IUser | null;
}

export const isAuth = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      res.status(400).json({
        message: "Please login - No auth headers",
      });
    }

    const token = authHeader?.split(" ")[1];
    const deodedValue = jwt.verify(
      token!,
      process.env.JWT_SECRET as string,
    ) as JwtPayload;

    if (!deodedValue || !deodedValue.user) {
      res.status(401).json({
        messge: "Invalid token",
      });
      return;
    }
    req.user = deodedValue.user;
    next();
  } catch (error) {
    res.status(401).json({
      message: "Please Login - Jwt Error: ",
      error,
    });
  }
};

export default isAuth;
