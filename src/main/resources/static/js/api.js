function authFetch(url, options = {}) {
  const token = localStorage.getItem("token");

  return fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`,
      ...(options.headers || {})
    }
  }).then(res => {
    if (res.status === 401 || res.status === 403) {
      logout();
    }
    return res;
  });
}
