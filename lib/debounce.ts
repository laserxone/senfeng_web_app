export function debounce(func, delay = 1000) {
  let timeout: number
  return (...args) => {
    clearTimeout(timeout)
    timeout = setTimeout(() => {
      func(...args)
    }, delay)
  }
}

export function debouncePromise(func, delay = 1000) {
  let timeout: number
  let promiseReject

  return (...args) => {
    if (timeout) {
      clearTimeout(timeout)
      if (promiseReject) {
        promiseReject({ canceled: true })
      }
    }

    return new Promise((resolve, reject) => {
      promiseReject = reject

      timeout = setTimeout(async () => {
        try {
          const result = await func(...args)
          resolve(result)
        } catch (err) {
          reject(err)
        }
      }, delay)
    })
  }
}
