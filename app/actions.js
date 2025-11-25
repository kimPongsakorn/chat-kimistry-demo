'use server'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

export async function login(formData) {
  const email = formData.get('email')
  const password = formData.get('password')

  // 1. ยิง API
  const BASE_API = process.env.BASE_API || process.env.NEXT_PUBLIC_BASE_API || 'https://mobile-api-production-40c5.up.railway.app'
  const apiUrl = `${BASE_API.replace(/\/$/, '')}/api/v1/auth/login`
  
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

  // 8. จบงาน -> กลับไปหน้าแรก (จะแสดงข้อมูล user ที่ login แล้ว)
  redirect('/')
}

export async function getUser() {
  const cookieStore = await cookies()
  const accessToken = cookieStore.get('accessToken')?.value
  
  if (!accessToken) {
    return null
  }
  
  try {
    // ยิง API เพื่อดึงข้อมูล user ล่าสุดจาก server
    const BASE_API = process.env.BASE_API || process.env.NEXT_PUBLIC_BASE_API || 'https://mobile-api-production-40c5.up.railway.app'
    const apiUrl = `${BASE_API.replace(/\/$/, '')}/api/v1/auth/me`
    
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

export async function getFriends() {
  const cookieStore = await cookies()
  const accessToken = cookieStore.get('accessToken')?.value
  
  if (!accessToken) {
    return null
  }
  
  // TODO: Implement getFriends API call
  return null
}

export async function logout() {
  const cookieStore = await cookies()
  const accessToken = cookieStore.get('accessToken')?.value

  // 1. ยิง API logout ถ้ามี accessToken
  if (accessToken) {
    try {
      const BASE_API = process.env.BASE_API || process.env.NEXT_PUBLIC_BASE_API || 'https://mobile-api-production-40c5.up.railway.app'
      const apiUrl = `${BASE_API.replace(/\/$/, '')}/api/v1/auth/logout`
      
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