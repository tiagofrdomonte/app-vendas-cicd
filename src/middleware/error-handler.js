function errorHandler(err, req, res, next) {
  const status = err.status || 500;
  if (status >= 500) {
    // Avoid leaking internals in responses.
    console.error(err);
  }

  if (req.accepts('html')) {
    return res.status(status).render('error', {
      title: 'Erro',
      message: status === 500 ? 'Erro interno do servidor.' : err.message
    });
  }

  return res.status(status).json({
    error: status === 500 ? 'Internal Server Error' : err.message
  });
}

module.exports = { errorHandler };
