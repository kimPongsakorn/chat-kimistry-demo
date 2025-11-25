'use server'

import { getBaseApiUrl } from '@/lib/api'
import { revalidatePath } from 'next/cache'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

export async function login(formData) {
  const email = formData.get('email')
  const password = formData.get('password')

  // 1. ยิง API
  const BASE_API = getBaseApiUrl()
  const apiUrl = `${BASE_API}/api/v1/auth/login`
  
  const res = await fetch(apiUrl, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'accept': 'application/json'
    },
    body: JSON.stringify({ email, password }),
  })

  // 2. แปลง Response เป็น JSON
  let responseJson
  try {
    responseJson = await res.json()
  } catch (error) {
    throw new Error('Invalid response from server')
  }

  // 3. เช็คว่า Login ผ่านไหม (เช็คจาก http status หรือ field status ใน json ก็ได้)
  if (!res.ok || responseJson.status !== 'success') {
    // ส่ง Error กลับไป หรือ Throw Error
    throw new Error(responseJson.message || `Login failed: ${res.status} ${res.statusText}`)
  }

  // 4. ดึงข้อมูลจากโครงสร้าง JSON ของคุณ
  // responseJson = { status: "success", data: { accessToken, user, ... } }
  const { accessToken, refreshToken, user } = responseJson.data

  const cookieStore = await cookies()

  // 5. ✅ เก็บ Access Token (หมดอายุ 15 นาที)
  cookieStore.set({
    name: 'accessToken',
    value: accessToken,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 15, // 15 นาที
  })

  // 6. ✅ เก็บ Refresh Token (อายุยาวกว่า เช่น 7 วัน หรือ 30 วัน)
  cookieStore.set({
    name: 'refreshToken',
    value: refreshToken,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 24 * 7, // 7 วัน
  })

  // 7. ✅ เก็บข้อมูล User (ไม่ต้อง HttpOnly เพื่อให้ client component อ่านได้)
  cookieStore.set({
    name: 'user',
    value: JSON.stringify(user),
    httpOnly: false,
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 24 * 7, // 7 วัน
  })

  // 8. Revalidate path เพื่อให้ Next.js refresh ข้อมูล
  revalidatePath('/')

  // 9. Return success (ไม่ใช้ redirect เพราะจะ throw error ใน client component)
  return { success: true, user }
}

export async function getUser() {
  const cookieStore = await cookies()
  const accessToken = cookieStore.get('accessToken')?.value
  
  if (!accessToken) {
    return null
  }
  
  try {
    // ยิง API เพื่อดึงข้อมูล user ล่าสุดจาก server
    const BASE_API = getBaseApiUrl()
    const apiUrl = `${BASE_API}/api/v1/auth/me`
    
    const res = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'accept': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
    })
    
    if (!res.ok) {
      // ถ้า token หมดอายุหรือไม่ valid ให้ลบ cookies
      if (res.status === 401) {
        cookieStore.delete('accessToken')
        cookieStore.delete('refreshToken')
        cookieStore.delete('user')
      }
      return null
    }
    
    const responseJson = await res.json()
    
    if (responseJson.status === 'success' && responseJson.data) {
      // อัพเดท user data ใน cookies
      const userData = {
        id: responseJson.data.userId,
        email: responseJson.data.email,
        name: responseJson.data.name,
      }
      
      cookieStore.set({
        name: 'user',
        value: JSON.stringify(userData),
        httpOnly: false,
        secure: process.env.NODE_ENV === 'production',
        path: '/',
        maxAge: 60 * 60 * 24 * 7, // 7 วัน
      })
      
      return userData
    }
    
    return null
  } catch (error) {
    console.error('Get user error:', error)
    return null
  }
}

export async function getFriends(page = 1, limit = 20) {
  const cookieStore = await cookies()
  const accessToken = cookieStore.get('accessToken')?.value
  
  if (!accessToken) {
    return null
  }
  
  try {
    const BASE_API = getBaseApiUrl()
    const apiUrl = `${BASE_API}/api/v1/users/friends?page=${page}&limit=${limit}`
    
    const res = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'accept': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
    })
    
    // ถ้า access token หมดอายุ ลอง refresh token
    if (res.status === 401) {
      try {
        await refreshToken()
        // Retry request with new token
        const newAccessToken = (await cookies()).get('accessToken')?.value
        if (newAccessToken) {
          const retryRes = await fetch(apiUrl, {
            method: 'GET',
            headers: {
              'accept': 'application/json',
              'Authorization': `Bearer ${newAccessToken}`,
            },
          })
          
          if (!retryRes.ok) {
            const errorData = await retryRes.json().catch(() => ({}))
            throw new Error(errorData.message || `Failed to get friends: ${retryRes.status}`)
          }
          
          const responseJson = await retryRes.json()
          return responseJson
        }
      } catch (refreshError) {
        throw new Error('Session expired. Please login again.')
      }
    }
    
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}))
      throw new Error(errorData.message || `Failed to get friends: ${res.status}`)
    }
    
    const responseJson = await res.json()
    return responseJson
  } catch (error) {
    console.error('Get friends error:', error)
    throw error
  }
}

export async function refreshToken() {
  const cookieStore = await cookies()
  const refreshTokenValue = cookieStore.get('refreshToken')?.value
  
  if (!refreshTokenValue) {
    throw new Error('No refresh token available')
  }
  
  try {
    const BASE_API = getBaseApiUrl()
    const apiUrl = `${BASE_API}/api/v1/auth/refresh`
    
    const res = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refreshToken: refreshTokenValue }),
    })
    
    if (!res.ok) {
      // ถ้า refresh token หมดอายุ ให้ลบ cookies ทั้งหมด
      if (res.status === 401) {
        cookieStore.delete('accessToken')
        cookieStore.delete('refreshToken')
        cookieStore.delete('user')
      }
      const errorData = await res.json().catch(() => ({}))
      throw new Error(errorData.message || `Failed to refresh token: ${res.status}`)
    }
    
    const responseJson = await res.json()
    
    if (responseJson.status === 'success' && responseJson.data) {
      const { accessToken, refreshToken: newRefreshToken } = responseJson.data
      
      // อัพเดท Access Token
      cookieStore.set({
        name: 'accessToken',
        value: accessToken,
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        path: '/',
        maxAge: 60 * 15, // 15 นาที
      })
      
      // อัพเดท Refresh Token (ถ้ามี)
      if (newRefreshToken) {
        cookieStore.set({
          name: 'refreshToken',
          value: newRefreshToken,
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          path: '/',
          maxAge: 60 * 60 * 24 * 7, // 7 วัน
        })
      }
      
      return { accessToken, refreshToken: newRefreshToken }
    }
    
    throw new Error('Invalid response from refresh token API')
  } catch (error) {
    console.error('Refresh token error:', error)
    throw error
  }
}

export async function sendMessage(conversationId, content) {
  const cookieStore = await cookies()
  const accessToken = cookieStore.get('accessToken')?.value
  
  if (!accessToken) {
    throw new Error('Not authenticated')
  }
  
  if (!conversationId) {
    throw new Error('Conversation ID is required')
  }
  
  try {
    const BASE_API = getBaseApiUrl()
    const apiUrl = `${BASE_API}/api/v1/chat/messages`
    
    const res = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ conversationId, content }),
    })
    
    // ถ้า access token หมดอายุ ลอง refresh token
    if (res.status === 401) {
      try {
        await refreshToken()
        // Retry request with new token
        const newAccessToken = (await cookies()).get('accessToken')?.value
        if (newAccessToken) {
          const retryRes = await fetch(apiUrl, {
            method: 'POST',
            headers: {
              'accept': 'application/json',
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${newAccessToken}`,
            },
            body: JSON.stringify({ conversationId, content }),
          })
          
          if (!retryRes.ok) {
            const errorData = await retryRes.json().catch(() => ({}))
            throw new Error(errorData.message || `Failed to send message: ${retryRes.status}`)
          }
          
          const responseJson = await retryRes.json()
          return responseJson
        }
      } catch (refreshError) {
        throw new Error('Session expired. Please login again.')
      }
    }
    
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}))
      throw new Error(errorData.message || `Failed to send message: ${res.status}`)
    }
    
    const responseJson = await res.json()
    return responseJson
  } catch (error) {
    console.error('Send message error:', error)
    throw error
  }
}

export async function getMessages(conversationId, limit = 20, cursor = null) {
  const cookieStore = await cookies()
  const accessToken = cookieStore.get('accessToken')?.value
  
  if (!accessToken) {
    return null
  }
  
  if (!conversationId) {
    return null
  }
  
  try {
    const BASE_API = getBaseApiUrl()
    let apiUrl = `${BASE_API}/api/v1/chat/messages/${conversationId}?limit=${limit}`
    if (cursor) {
      apiUrl += `&cursor=${cursor}`
    }
    
    const res = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'accept': '*/*',
        'Authorization': `Bearer ${accessToken}`,
      },
    })
    
    // ถ้า access token หมดอายุ ลอง refresh token
    if (res.status === 401) {
      try {
        await refreshToken()
        // Retry request with new token
        const newAccessToken = (await cookies()).get('accessToken')?.value
        if (newAccessToken) {
          const retryRes = await fetch(apiUrl, {
            method: 'GET',
            headers: {
              'accept': '*/*',
              'Authorization': `Bearer ${newAccessToken}`,
            },
          })
          
          if (!retryRes.ok) {
            const errorData = await retryRes.json().catch(() => ({}))
            throw new Error(errorData.message || `Failed to get messages: ${retryRes.status}`)
          }
          
          const responseJson = await retryRes.json()
          return responseJson
        }
      } catch (refreshError) {
        throw new Error('Session expired. Please login again.')
      }
    }
    
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}))
      throw new Error(errorData.message || `Failed to get messages: ${res.status}`)
    }
    
    const responseJson = await res.json()
    return responseJson
  } catch (error) {
    console.error('Get messages error:', error)
    throw error
  }
}

export async function getConversations(page = 1, limit = 20) {
  const cookieStore = await cookies()
  const accessToken = cookieStore.get('accessToken')?.value
  
  if (!accessToken) {
    return null
  }
  
  try {
    const BASE_API = getBaseApiUrl()
    const apiUrl = `${BASE_API}/api/v1/chat/conversations?page=${page}&limit=${limit}`
    
    const res = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'accept': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
    })
    
    // ถ้า access token หมดอายุ ลอง refresh token
    if (res.status === 401) {
      try {
        await refreshToken()
        // Retry request with new token
        const newAccessToken = (await cookies()).get('accessToken')?.value
        if (newAccessToken) {
          const retryRes = await fetch(apiUrl, {
            method: 'GET',
            headers: {
              'accept': 'application/json',
              'Authorization': `Bearer ${newAccessToken}`,
            },
          })
          
          if (!retryRes.ok) {
            const errorData = await retryRes.json().catch(() => ({}))
            throw new Error(errorData.message || `Failed to get conversations: ${retryRes.status}`)
          }
          
          const responseJson = await retryRes.json()
          return responseJson
        }
      } catch (refreshError) {
        throw new Error('Session expired. Please login again.')
      }
    }
    
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}))
      throw new Error(errorData.message || `Failed to get conversations: ${res.status}`)
    }
    
    const responseJson = await res.json()
    return responseJson
  } catch (error) {
    console.error('Get conversations error:', error)
    throw error
  }
}

export async function logout() {
  const cookieStore = await cookies()
  const accessToken = cookieStore.get('accessToken')?.value

  // 1. ยิง API logout ถ้ามี accessToken
  if (accessToken) {
    try {
      const BASE_API = getBaseApiUrl()
      const apiUrl = `${BASE_API}/api/v1/auth/logout`
      
      await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'accept': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
      })
    } catch (error) {
      // ถ้ายิง API ไม่สำเร็จก็ยังลบ cookies ต่อ
      console.error('Logout API error:', error)
    }
  }

  // 2. ลบ cookies ทั้งหมด
  cookieStore.delete('accessToken')
  cookieStore.delete('refreshToken')
  cookieStore.delete('user')
  
  // 3. Redirect กลับหน้าแรก
  redirect('/')
}