import Link from "next/link";
import { AdminShell } from "@/app/admin/admin-shell";
import { CategoryForm } from "../category-form";

export default async function NewCategoryPage() {
  return (
    <AdminShell>
      <div className="mx-auto grid max-w-[700px] gap-4">
        <Link className="text-sm font-bold text-plum-dark underline" href="/admin/categorias">
          ← Categorias
        </Link>
        <header>
          <p className="mb-1 mt-0 text-xs font-extrabold tracking-[0.12em] text-plum uppercase">
            Cadastro
          </p>
          <h1 className="m-0 font-serif text-2xl text-ink">Nova categoria</h1>
        </header>
        <CategoryForm category={null} />
      </div>
    </AdminShell>
  );
}
