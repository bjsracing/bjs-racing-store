// src/components/WhatsAppChatButton.jsx
import React from "react";

const WhatsAppChatButton = ({ phone = "0881011669213", message = "Halo BJS Racing, saya mau tanya tentang produk..." }) => {
  const encodedMessage = encodeURIComponent(message);
  const href = `https://wa.me/${phone}?text=${encodedMessage}`;

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-5 right-5 z-50 bg-green-500 hover:bg-green-600 text-white p-3 rounded-full shadow-lg flex items-center justify-center transition-colors"
      aria-label="Chat WhatsApp"
    >
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
        <path d="M17.472 14.382c-.297-.149-1.755-.867-2.031-.967-.273-.099-.472-.298-.668-.477-.195-.178-.466-.297-.785-.297a1.19 1.19 0 0 0-.869.375c-.297.298-1.163 1.065-1.163 2.593 0 1.528 1.178 2.999 1.338 3.205.159.207 2.183 3.354 5.291 4.722.739.322 1.315.515 1.764.663.738.241 1.411.207 1.943.126.574-.087 1.755-.717 2.005-1.409.248-.69.248-1.281.173-1.409-.074-.128-.273-.207-.573-.357zM12.04 2C6.767 2 2.5 6.238 2.5 11.493c0 2.18.716 4.23 1.972 5.952L2.5 22l5.301-1.391c1.395.761 2.968 1.176 4.239 1.176 5.273 0 9.54-4.238 9.54-9.494S17.313 2 12.04 2z" />
      </svg>
    </a>
  );
};

export default WhatsAppChatButton;
