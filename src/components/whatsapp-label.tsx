import Image from "next/image";

export function WhatsAppLabel() {
  return (
    <>
      <span className="whatsapp-icon" aria-hidden="true">
        <Image src="/icons/whatsapp.svg" alt="" width={20} height={20} />
      </span>
      <span>Falar no WhatsApp</span>
    </>
  );
}
