import { Identitas } from "../service";

interface Props {
  data?: Identitas | null;
}

export default function UserAddressCard({ data }: Props) {
  const empty = "Data Belum Diisi";

  return (
    <div className="border border-gray-200 rounded-2xl dark:border-gray-800 overflow-hidden">
      {/* Section header — sama seperti Ketua Kontingen & PIC/Operator */}
      <div className="flex items-center justify-between px-5 py-3 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <h4 className="text-sm font-semibold text-gray-800 dark:text-white">
          Informasi Instansi
        </h4>
      </div>

      <div className="p-5 lg:p-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:gap-6">
          <div className="sm:col-span-2">
            <p className="text-xs text-gray-400 dark:text-gray-500 mb-0.5">Alamat Instansi</p>
            <p className="text-sm font-medium text-gray-800 dark:text-white/90 break-words">
              {data?.alamat || empty}
            </p>
          </div>

          <div>
            <p className="text-xs text-gray-400 dark:text-gray-500 mb-0.5">Email Instansi</p>
            <p className="text-sm font-medium text-gray-800 dark:text-white/90 break-words">
              {data?.email_instansi || empty}
            </p>
          </div>

          <div>
            <p className="text-xs text-gray-400 dark:text-gray-500 mb-0.5">Telepon Instansi</p>
            <p className="text-sm font-medium text-gray-800 dark:text-white/90">
              {data?.phone_instansi || empty}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
