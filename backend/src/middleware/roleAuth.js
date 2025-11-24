export const authorize = (roles = []) => {
    // roles param can be a single role string (e.g. 'admin') 
    // or an array of roles (e.g. ['admin', 'teacher'])
    if (typeof roles === 'string') {
        roles = [roles];
    }

    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ message: 'No autenticado' });
        }

        if (roles.length && !roles.includes(req.user.rol)) {
            return res.status(403).json({ message: 'No autorizado' });
        }

        next();
    };
};
