import api from './axios'

export const signup = async (data) => {
  const response = await api.post('/members/signup', data)
  return response.data
}
