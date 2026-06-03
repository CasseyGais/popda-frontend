const API_BASE_URL = "http://localhost:8000";

export interface ApiClientOptions {
  method?: string;
  body?: unknown;
  headers?: HeadersInit;
}

/**
 * API Client untuk berkomunikasi dengan backend POPDA 2026
 * Sesuai dengan Postman collection yang tersedia
 */
export const apiClient = async <T = any>(
  endpoint: string,
  options: ApiClientOptions = {}
): Promise<T> => {
  const { method = "GET", body, headers = {} } = options;

  // Ambil token dari localStorage untuk autentikasi
  const token = localStorage.getItem('token');
  
  const config: RequestInit = {
    method,
    credentials: "include",
    headers: {
      // Default headers
      "Accept": "application/json",
      ...headers,
      // Tambahkan Authorization header jika token ada (sesuai Postman)
      ...(token && { Authorization: `Bearer ${token}` }),
      // Tambahkan Content-Type untuk JSON body
      ...(body && !(body instanceof FormData)
        ? { "Content-Type": "application/json" }
        : {}),
    },
    body: body
      ? body instanceof FormData
        ? body
        : JSON.stringify(body)
      : undefined,
  };

  try {
    // Build full URL
    const fullUrl = endpoint.startsWith('http') 
      ? endpoint 
      : `${API_BASE_URL}${endpoint}`;

    console.log(`🚀 API Request: ${method} ${fullUrl}`, body ? { body } : '');

    const response = await fetch(fullUrl, config);

    // Handle authentication errors
    // Skip redirect jika ini adalah endpoint login — 401 berarti email/password salah
    if (response.status === 401 || response.status === 403) {
      const isLoginEndpoint = endpoint === "/login" || endpoint.endsWith("/login");

      if (!isLoginEndpoint) {
        console.warn("⚠️ Sesi login berakhir atau tidak diizinkan");
        localStorage.removeItem('token');
        localStorage.removeItem('user_data');
        if (typeof window !== "undefined") {
          window.location.href = "/login";
        }
        throw new Error("Sesi login berakhir. Silakan login kembali.");
      }

      // Untuk endpoint login: parse response dan lempar pesan dari backend
      const contentType = response.headers.get('content-type');
      let errData: any = {};
      try {
        const text = await response.text();
        errData = text ? JSON.parse(text) : {};
      } catch {}
      const loginError = new Error(
        errData?.message || errData?.error || "Email atau password salah."
      );
      (loginError as any).status = 401;
      throw loginError;
    }

    // Handle response berdasarkan content type
    const contentType = response.headers.get('content-type');
    
    // Handle file downloads (PDF, images, etc.)
    if (contentType && (
      contentType.includes('application/pdf') || 
      contentType.includes('application/octet-stream') || 
      contentType.includes('image/')
    )) {
      const blob = await response.blob();
      return blob as T;
    }

    // Parse JSON response
    let data: T;
    try {
      const responseText = await response.text();
      data = responseText ? JSON.parse(responseText) : {} as T;
    } catch (parseError) {
      console.warn("⚠️ Gagal parse response JSON:", parseError);
      data = {} as T;
    }

    // Handle HTTP errors
    if (!response.ok) {
      const errorMessage = (data as any)?.message || 
                          (data as any)?.error || 
                          `Terjadi kesalahan: ${response.status} ${response.statusText}`;
      throw new Error(errorMessage);
    }

    console.log(`✅ API Response: ${method} ${fullUrl}`, data);
    return data;

  } catch (err) {
    console.error("❌ API Client Error:", err);
    
    // Jika error adalah network error atau fetch error
    if (err instanceof TypeError && err.message.includes('fetch')) {
      throw new Error("Tidak dapat terhubung ke server. Periksa koneksi internet Anda.");
    }
    
    throw err;
  }
};

/**
 * Helper function untuk membuat request dengan method tertentu
 */
export const api = {
  get: <T = any>(endpoint: string, headers?: HeadersInit) => 
    apiClient<T>(endpoint, { method: 'GET', headers }),
    
  post: <T = any>(endpoint: string, body?: unknown, headers?: HeadersInit) => 
    apiClient<T>(endpoint, { method: 'POST', body, headers }),
    
  put: <T = any>(endpoint: string, body?: unknown, headers?: HeadersInit) => 
    apiClient<T>(endpoint, { method: 'PUT', body, headers }),
    
  delete: <T = any>(endpoint: string, headers?: HeadersInit) => 
    apiClient<T>(endpoint, { method: 'DELETE', headers }),
    
  patch: <T = any>(endpoint: string, body?: unknown, headers?: HeadersInit) => 
    apiClient<T>(endpoint, { method: 'PATCH', body, headers }),
};

export default apiClient;