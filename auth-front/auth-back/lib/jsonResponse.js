exports.jsonResponse = function (statusCode, body) {
  // Validar el código de estado
  if (typeof statusCode !== "number" || statusCode < 100 || statusCode > 599) {
    throw new Error("El statusCode debe ser un número válido entre 100 y 599.");
  }

  // Validar el cuerpo de la respuesta
  if (body === undefined || body === null) {
    throw new Error("El cuerpo de la respuesta (body) no puede ser nulo ni indefinido.");
  }

  const response = {
    statusCode,
    body,
  };

  // Agregar clave de error si el código de estado indica un error
  if (statusCode >= 400) {
    response.error = true;
  }

  return response;
};