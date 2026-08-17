import Link from "next/link";
import { notFound } from "next/navigation";

import { EventForm } from "@/app/admin/_components/event-form";
import { PhotoManager } from "@/app/admin/_components/photo-manager";
import styles from "@/app/admin/admin.module.css";
import { isDemoMode } from "@/lib/config/runtime";
import { getAdminEventById } from "@/lib/events/queries";

type EditEventPageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditEventPage({ params }: EditEventPageProps) {
  const { id } = await params;
  const event = await getAdminEventById(id);

  if (!event) {
    notFound();
  }

  const demoMode = isDemoMode();

  return (
    <>
      <header className={styles.pageHeader}>
        <div>
          <p className={styles.eyebrow}>Editar conteúdo</p>
          <h1 className={styles.title}>{event.title}</h1>
          <p className={styles.subtitle}>
            Atualize informações, adicione novas fotos ou altere o estado de publicação.
          </p>
        </div>
        <Link className={styles.secondaryButton} href="/admin">Voltar</Link>
      </header>

      <EventForm eventId={event.id} initialEvent={event} demoMode={demoMode} />
      <PhotoManager
        eventId={event.id}
        photos={event.photos}
        demoMode={demoMode}
      />
    </>
  );
}
