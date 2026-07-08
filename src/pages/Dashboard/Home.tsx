import PageMeta from "../../components/common/PageMeta";

export default function Home() {
  return (
    <>
      <PageMeta
        title="Dashboard | POPDA 2026"
        description="Dashboard POPDA 2026 - Sistem Pendaftaran Olahraga Terpadu"
      />
      <div className="grid grid-cols-12 gap-4 md:gap-6">
        <div className="col-span-12">
          <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-white/90">
              Selamat Datang di POPDA 2026
            </h2>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              Sistem Pendaftaran Olahraga Terpadu
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
