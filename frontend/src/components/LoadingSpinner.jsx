import { Box, Spinner, Text } from '@chakra-ui/react';

export default function LoadingSpinner({ message = 'Cargando...' }) {
  return (
    <Box 
      display="flex" 
      flexDirection="column" 
      alignItems="center" 
      justifyContent="center" 
      minHeight="100vh"
      bg="gray.50"
    >
      <Spinner
        thickness="4px"
        speed="0.65s"
        emptyColor="gray.200"
        color="blue.500"
        size="xl"
        mb={4}
      />
      <Text fontSize="lg" color="gray.600">{message}</Text>
    </Box>
  );
}
