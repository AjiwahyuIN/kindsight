export async function apiRequest(path, {body, method = 'GET', signal} = {}) {
  const multipart = body instanceof FormData;
  const mutate = !['GET','HEAD'].includes(method);
  let response;
  try {
    response = await fetch(`/api/v1/${path}`, {
      method, signal, credentials:'same-origin',cache:'no-store',
      headers:mutate ? {...(!multipart?{'Content-Type':'application/json'}:{}),'X-Kindsight-Request':'1'} : {},
      ...(mutate ? {body:multipart?body:JSON.stringify(body ?? {})} : {}),
    });
  } catch (cause) {
    if (cause.name === 'AbortError') throw cause;
    throw new Error('Unable to connect. Please check the local API and try again.');
  }
  if (response.status === 204) return;
  let payload;
  try { payload = await response.json(); } catch { throw new Error('Unexpected API response. Please try again.'); }
  if (!response.ok) {
    const error = new Error(payload.error?.message || 'Unable to complete this request.');
    Object.assign(error,{code:payload.error?.code,fields:payload.error?.fields,status:response.status});
    throw error;
  }
  return payload;
}
