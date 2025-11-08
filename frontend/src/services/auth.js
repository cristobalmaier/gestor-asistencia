import api from './api'

export async function loginRequest(email, password) {
  return api.post('/auth/login', { email, password })
}
