import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import { 
  Box, 
  Button, 
  Table, 
  Thead, 
  Tbody, 
  Tr, 
  Th, 
  Td, 
  useDisclosure, 
  Modal, 
  ModalOverlay, 
  ModalContent, 
  ModalHeader, 
  ModalFooter, 
  ModalBody, 
  ModalCloseButton,
  FormControl,
  FormLabel,
  Input,
  Select,
  useToast,
  IconButton,
  Tooltip
} from '@chakra-ui/react';
import { AddIcon, EditIcon, DeleteIcon } from '@chakra-ui/icons';

export default function GestionUsuarios() {
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    nombre: '',
    apellido: '',
    rol: 'alumno'
  });
  const [editId, setEditId] = useState(null);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const toast = useToast();
  const { user, hasRole } = useAuth();

  // Verificar si el usuario es administrador
  if (!hasRole('admin')) {
    return (
      <Box p={4} textAlign="center">
        <p>No tienes permisos para acceder a esta sección.</p>
      </Box>
    );
  }

  const fetchUsuarios = async () => {
    try {
      setLoading(true);
      
      // Obtener usuarios de autenticación
      const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
      if (authError) throw authError;
      
      // Obtener roles de usuarios
      const { data: userRoles, error: rolesError } = await supabase
        .from('usuarios_roles')
        .select('*');
      
      if (rolesError) throw rolesError;
      
      // Combinar datos de autenticación con roles
      const usuariosConRoles = authUsers.users.map(authUser => {
        const userRole = userRoles.find(ur => ur.user_id === authUser.id);
        return {
          id: authUser.id,
          email: authUser.email,
          nombre: authUser.user_metadata?.nombre || '',
          apellido: authUser.user_metadata?.apellido || '',
          rol: userRole?.rol || 'sin_rol',
          created_at: authUser.created_at
        };
      });
      
      setUsuarios(usuariosConRoles);
    } catch (error) {
      console.error('Error al cargar usuarios:', error);
      toast({
        title: 'Error',
        description: 'No se pudieron cargar los usuarios',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsuarios();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      if (editId) {
        // Actualizar usuario existente
        const { error: updateError } = await supabase.auth.admin.updateUserById(editId, {
          email: formData.email,
          user_metadata: {
            nombre: formData.nombre,
            apellido: formData.apellido
          }
        });
        
        if (updateError) throw updateError;
        
        // Actualizar rol
        const { error: roleError } = await supabase
          .from('usuarios_roles')
          .upsert(
            { user_id: editId, rol: formData.rol },
            { onConflict: 'user_id' }
          );
          
        if (roleError) throw roleError;
        
        toast({
          title: 'Usuario actualizado',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      } else {
        // Crear nuevo usuario
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
          options: {
            data: {
              nombre: formData.nombre,
              apellido: formData.apellido
            }
          }
        });
        
        if (authError) throw authError;
        
        // Asignar rol
        const { error: roleError } = await supabase
          .from('usuarios_roles')
          .insert([{ user_id: authData.user.id, rol: formData.rol }]);
          
        if (roleError) throw roleError;
        
        toast({
          title: 'Usuario creado',
          description: 'Se ha enviado un correo de verificación al usuario',
          status: 'success',
          duration: 5000,
          isClosable: true,
        });
      }
      
      // Recargar lista de usuarios y cerrar modal
      fetchUsuarios();
      handleClose();
    } catch (error) {
      console.error('Error al guardar usuario:', error);
      toast({
        title: 'Error',
        description: error.message || 'Ocurrió un error al guardar el usuario',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const handleEdit = (usuario) => {
    setFormData({
      email: usuario.email,
      password: '',
      nombre: usuario.nombre,
      apellido: usuario.apellido,
      rol: usuario.rol
    });
    setEditId(usuario.id);
    onOpen();
  };

  const handleDelete = async (id) => {
    if (window.confirm('¿Estás seguro de que deseas eliminar este usuario?')) {
      try {
        const { error } = await supabase.auth.admin.deleteUser(id);
        if (error) throw error;
        
        // Eliminar rol
        await supabase
          .from('usuarios_roles')
          .delete()
          .eq('user_id', id);
        
        toast({
          title: 'Usuario eliminado',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
        
        fetchUsuarios();
      } catch (error) {
        console.error('Error al eliminar usuario:', error);
        toast({
          title: 'Error',
          description: 'No se pudo eliminar el usuario',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      }
    }
  };

  const handleClose = () => {
    setFormData({
      email: '',
      password: '',
      nombre: '',
      apellido: '',
      rol: 'alumno'
    });
    setEditId(null);
    onClose();
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <Box p={4}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={6}>
        <h1 className="text-2xl font-bold text-gray-900">Gestión de Usuarios</h1>
        <Button 
          leftIcon={<AddIcon />} 
          colorScheme="blue"
          onClick={() => onOpen()}
        >
          Nuevo Usuario
        </Button>
      </Box>

      <Box bg="white" borderRadius="lg" p={4} boxShadow="sm">
        <Table variant="simple">
          <Thead>
            <Tr>
              <Th>Nombre</Th>
              <Th>Email</Th>
              <Th>Rol</Th>
              <Th>Creado</Th>
              <Th>Acciones</Th>
            </Tr>
          </Thead>
          <Tbody>
            {loading ? (
              <Tr>
                <Td colSpan="5" textAlign="center">Cargando usuarios...</Td>
              </Tr>
            ) : usuarios.length === 0 ? (
              <Tr>
                <Td colSpan="5" textAlign="center">No hay usuarios registrados</Td>
              </Tr>
            ) : (
              usuarios.map((usuario) => (
                <Tr key={usuario.id}>
                  <Td>{usuario.nombre} {usuario.apellido}</Td>
                  <Td>{usuario.email}</Td>
                  <Td textTransform="capitalize">{usuario.rol}</Td>
                  <Td>{formatDate(usuario.created_at)}</Td>
                  <Td>
                    <Tooltip label="Editar usuario">
                      <IconButton
                        icon={<EditIcon />}
                        size="sm"
                        colorScheme="blue"
                        variant="ghost"
                        mr={2}
                        onClick={() => handleEdit(usuario)}
                        aria-label="Editar usuario"
                      />
                    </Tooltip>
                    <Tooltip label="Eliminar usuario">
                      <IconButton
                        icon={<DeleteIcon />}
                        size="sm"
                        colorScheme="red"
                        variant="ghost"
                        onClick={() => handleDelete(usuario.id)}
                        isDisabled={usuario.id === user?.id} // No permitir eliminarse a sí mismo
                        aria-label="Eliminar usuario"
                      />
                    </Tooltip>
                  </Td>
                </Tr>
              ))
            )}
          </Tbody>
        </Table>
      </Box>

      {/* Modal para crear/editar usuario */}
      <Modal isOpen={isOpen} onClose={handleClose} size="lg">
        <ModalOverlay />
        <ModalContent as="form" onSubmit={handleSubmit}>
          <ModalHeader>{editId ? 'Editar Usuario' : 'Nuevo Usuario'}</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormControl isRequired>
                <FormLabel>Nombre</FormLabel>
                <Input 
                  name="nombre" 
                  value={formData.nombre}
                  onChange={handleInputChange}
                  placeholder="Nombre del usuario"
                />
              </FormControl>
              
              <FormControl isRequired>
                <FormLabel>Apellido</FormLabel>
                <Input 
                  name="apellido" 
                  value={formData.apellido}
                  onChange={handleInputChange}
                  placeholder="Apellido del usuario"
                />
              </FormControl>
              
              <FormControl isRequired>
                <FormLabel>Email</FormLabel>
                <Input 
                  type="email" 
                  name="email" 
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="correo@ejemplo.com"
                />
              </FormControl>
              
              <FormControl isRequired={!editId}>
                <FormLabel>Contraseña</FormLabel>
                <Input 
                  type="password" 
                  name="password" 
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder={editId ? 'Dejar en blanco para no cambiar' : 'Contraseña segura'}
                />
              </FormControl>
              
              <FormControl isRequired>
                <FormLabel>Rol</FormLabel>
                <Select 
                  name="rol" 
                  value={formData.rol}
                  onChange={handleInputChange}
                >
                  <option value="admin">Administrador</option>
                  <option value="profesor">Profesor</option>
                  <option value="preceptor">Preceptor</option>
                  <option value="alumno">Alumno</option>
                  <option value="padre">Padre/Tutor</option>
                  <option value="directivo">Directivo</option>
                </Select>
              </FormControl>
            </div>
          </ModalBody>
          
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={handleClose}>
              Cancelar
            </Button>
            <Button colorScheme="blue" type="submit">
              {editId ? 'Actualizar' : 'Crear'}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
}
