import { AdminShell } from "@/app/admin/admin-shell";
import { createClient } from "@/lib/supabase/server";
import {
  SettingsForm,
  type StoreSettings,
} from "./settings-form";

export default async function SettingsPage() {
  const supabase = await createClient();
  const { data: settings, error } = await supabase
    .from("store_settings")
    .select("id, name, description, address, logo_path")
    .limit(2)
    .returns<StoreSettings[]>();

  if (error || !settings || settings.length !== 1) {
    return (
      <AdminShell>
        <section className="mx-auto max-w-[760px] rounded-xl border border-rose-200 bg-rose-50 p-5 text-sm text-alert" role="alert">
          Não foi possível carregar as configurações. É necessário existir exatamente um registro da loja.
        </section>
      </AdminShell>
    );
  }

  const logoUrl = settings[0].logo_path
    ? supabase
        .storage
        .from("bonmarche-media")
        .getPublicUrl(settings[0].logo_path).data.publicUrl
    : null;

  return (
    <AdminShell>
      <div className="mx-auto grid max-w-[760px] gap-4">
        <header>
          <p className="mb-1 mt-0 text-xs font-extrabold tracking-[0.12em] text-plum uppercase">
            Perfil do estabelecimento
          </p>
          <h1 className="m-0 font-serif text-2xl leading-tight text-ink max-sm:text-xl">
            Configurações
          </h1>
          <p className="mb-0 mt-1 text-sm text-muted">
            Estas informações são exibidas no cardápio público.
          </p>
        </header>
        <SettingsForm settings={settings[0]} logoUrl={logoUrl} />
      </div>
    </AdminShell>
  );
}
