import jwt from 'jsonwebtoken';

export function authenticate(req, res, next) {
  const auth = req.headers['authorization'] || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
  if (!token) return res.status(401).json({ message: 'No autenticado' });
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET || 'super_secret_jwt_key');
    req.user = payload;
    return next();
  } catch (e) {
    return res.status(401).json({ message: 'Token inválido' });
  }
}
