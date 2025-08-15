export function clearPaymentSession() {
  const paymentKeys = [
    'cedulaConsultada',
    'facturaIds',
    'idPasarela',
    'requestId',
    'timeReference',
    'sessionId',
  ];

  paymentKeys.forEach((key) => localStorage.removeItem(key));

  // Remove any other keys related to payment sessions
  Object.keys(localStorage)
    .filter((key) => key.toLowerCase().includes('payment') || key.toLowerCase().includes('pago'))
    .forEach((key) => localStorage.removeItem(key));
}

export default clearPaymentSession;
