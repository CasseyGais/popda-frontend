import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";

import {
  ChevronDownIcon,
  FormIcon,
  GridIcon,
  HorizontaLDots,
  ListIcon,
  TableIcon,
  UserCircleIcon,
} from "../../../icons";
import { useSidebar } from "../../../context/SidebarContext";
import { useAuth } from "../../../context/AuthContext";

type NavItem = {
  name: string;
  icon: React.ReactNode;
  path?: string;
  subItems?: { name: string; path: string; pro?: boolean; new?: boolean }[];
};

const othersItems: NavItem[] = [];

const AppSidebar: React.FC = () => {
  const { isExpanded, isMobileOpen, isHovered, setIsHovered } = useSidebar();
  const { can, permissions } = useAuth();
  const location = useLocation();

  // Hanya SUPERADMIN yang punya wildcard '*'
  const isSuperAdmin = permissions.includes("*");

  // ─── Menu item yang ditampilkan berdasarkan permission ────
  // Item utama — filter per permission
  const navItems: NavItem[] = [
    { icon: <GridIcon />,       name: "Beranda",               path: "/dashboard" },
    { icon: <UserCircleIcon />, name: "Identitas Kontingen",   path: "/identitas-kontingen" },
    ...(can("trx_kontingen_cabor.read")   ? [{ icon: <FormIcon />,  name: "Tahap I: Entry By Sport",   path: "/atlet-by-sports" }]  : []),
    ...(can("trx_kontingen_nomor.read")   ? [{ icon: <ListIcon />,  name: "Tahap II: Entry By Number", path: "/atlet-by-numbers" }] : []),
    ...(can("trx_pendaftaran_atlet.read") ? [{ icon: <TableIcon />, name: "Tahap III: Entry By Name",  path: "/atlet-by-names" }]   : []),
    // Rekap Pendaftaran — tampil untuk semua user yang login
    { icon: <FormIcon />, name: "Rekap Pendaftaran", path: "/rekap-pendaftaran" },
    // Validasi Pendaftaran — hanya superadmin
    ...(isSuperAdmin ? [{ icon: <ListIcon />, name: "Validasi Pendaftaran", path: "/admin/validasi-pendaftaran" }] : []),
    // Sertifikat — superadmin dan staff_lapangan
    ...(isSuperAdmin || can("sertifikat.read")
      ? [{ icon: <TableIcon />, name: "Sertifikat", path: "/sertifikat" }]
      : []),
    // Laporan Pertandingan — semua role yang sudah login
    { icon: <FormIcon />, name: "Laporan Pertandingan", path: "/laporan-pertandingan" },
  ];

  // Master Data & Settings — HANYA untuk SUPERADMIN
  // Role lain (ADMIN, STAFF_LAPANGAN) tidak boleh melihat grup ini sama sekali
  const masterDataSubItems = isSuperAdmin ? [
    { name: "Cabor", path: "/admin/cabor" },
    { name: "Nomor", path: "/admin/nomor" },
  ] : [];

  const settingsSubItems = isSuperAdmin ? [
    { name: "Users",               path: "/admin/users" },
    { name: "Roles",               path: "/admin/roles" },
    { name: "Territories",         path: "/admin/territories" },
    { name: "Modules",             path: "/admin/modules" },
    { name: "Permissions",         path: "/admin/permissions" },
    { name: "Pengaturan Tahap",    path: "/admin/pengaturan-tahap" },
  ] : [];

  // masterItems — hanya tampilkan grup jika ada sub-item (otomatis kosong untuk non-SUPERADMIN)
  const masterItems: NavItem[] = [
    ...(masterDataSubItems.length > 0 ? [{
      icon: <ListIcon />,
      name: "Master Data",
      subItems: masterDataSubItems,
    }] : []),
    ...(settingsSubItems.length > 0 ? [{
      icon: <TableIcon />,
      name: "Settings",
      subItems: settingsSubItems,
    }] : []),
  ];

  // ─────────────────────────────────────────────────────────

  const [openSubmenu, setOpenSubmenu] = useState<{
    type: "main" | "others" | "master";
    index: number;
  } | null>(null);
  const [subMenuHeight, setSubMenuHeight] = useState<Record<string, number>>({});
  const subMenuRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const isActive = useCallback(
    (path: string) => location.pathname === path,
    [location.pathname]
  );

  useEffect(() => {
    let submenuMatched = false;
    (["main", "others", "master"] as const).forEach((menuType) => {
      const items =
        menuType === "main"   ? navItems :
        menuType === "master" ? masterItems :
                                othersItems;
      items.forEach((nav, index) => {
        if (nav.subItems) {
          nav.subItems.forEach((subItem) => {
            if (isActive(subItem.path)) {
              setOpenSubmenu({ type: menuType, index });
              submenuMatched = true;
            }
          });
        }
      });
    });
    if (!submenuMatched) setOpenSubmenu(null);
  }, [location, isActive]);

  useEffect(() => {
    if (openSubmenu !== null) {
      const key = `${openSubmenu.type}-${openSubmenu.index}`;
      if (subMenuRefs.current[key]) {
        setSubMenuHeight((prev) => ({
          ...prev,
          [key]: subMenuRefs.current[key]?.scrollHeight || 0,
        }));
      }
    }
  }, [openSubmenu]);

  const handleSubmenuToggle = (
    index: number,
    menuType: "main" | "others" | "master"
  ) => {
    setOpenSubmenu((prev) => {
      if (prev && prev.type === menuType && prev.index === index) return null;
      return { type: menuType, index };
    });
  };

  const renderMenuItems = (
    items: NavItem[],
    menuType: "main" | "others" | "master"
  ) => (
    <ul className="flex flex-col gap-4">
      {items.map((nav, index) => (
        <li key={nav.name}>
          {nav.subItems ? (
            <button
              onClick={() => handleSubmenuToggle(index, menuType)}
              className={`menu-item group ${
                openSubmenu?.type === menuType && openSubmenu?.index === index
                  ? "menu-item-active"
                  : "menu-item-inactive"
              } cursor-pointer ${
                !isExpanded && !isHovered ? "lg:justify-center" : "lg:justify-start"
              }`}
            >
              <span
                className={`menu-item-icon-size ${
                  openSubmenu?.type === menuType && openSubmenu?.index === index
                    ? "menu-item-icon-active"
                    : "menu-item-icon-inactive"
                }`}
              >
                {nav.icon}
              </span>
              {(isExpanded || isHovered || isMobileOpen) && (
                <span className="menu-item-text">{nav.name}</span>
              )}
              {(isExpanded || isHovered || isMobileOpen) && (
                <ChevronDownIcon
                  className={`ml-auto w-5 h-5 transition-transform duration-200 ${
                    openSubmenu?.type === menuType && openSubmenu?.index === index
                      ? "rotate-180 text-brand-500"
                      : ""
                  }`}
                />
              )}
            </button>
          ) : (
            nav.path && (
              <Link
                to={nav.path}
                className={`menu-item group ${
                  isActive(nav.path) ? "menu-item-active" : "menu-item-inactive"
                }`}
              >
                <span
                  className={`menu-item-icon-size ${
                    isActive(nav.path)
                      ? "menu-item-icon-active"
                      : "menu-item-icon-inactive"
                  }`}
                >
                  {nav.icon}
                </span>
                {(isExpanded || isHovered || isMobileOpen) && (
                  <span className="menu-item-text">{nav.name}</span>
                )}
              </Link>
            )
          )}
          {nav.subItems && (isExpanded || isHovered || isMobileOpen) && (
            <div
              ref={(el) => { subMenuRefs.current[`${menuType}-${index}`] = el; }}
              className="overflow-hidden transition-all duration-300"
              style={{
                height:
                  openSubmenu?.type === menuType && openSubmenu?.index === index
                    ? `${subMenuHeight[`${menuType}-${index}`]}px`
                    : "0px",
              }}
            >
              <ul className="mt-2 space-y-1 ml-9">
                {nav.subItems.map((subItem) => (
                  <li key={subItem.name}>
                    <Link
                      to={subItem.path}
                      className={`menu-dropdown-item ${
                        isActive(subItem.path)
                          ? "menu-dropdown-item-active"
                          : "menu-dropdown-item-inactive"
                      }`}
                    >
                      {subItem.name}
                      <span className="flex items-center gap-1 ml-auto">
                        {subItem.new && (
                          <span className={`ml-auto ${isActive(subItem.path) ? "menu-dropdown-badge-active" : "menu-dropdown-badge-inactive"} menu-dropdown-badge`}>
                            new
                          </span>
                        )}
                        {subItem.pro && (
                          <span className={`ml-auto ${isActive(subItem.path) ? "menu-dropdown-badge-active" : "menu-dropdown-badge-inactive"} menu-dropdown-badge`}>
                            pro
                          </span>
                        )}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </li>
      ))}
    </ul>
  );

  return (
    <aside
      className={`fixed mt-16 flex flex-col lg:mt-0 top-0 px-5 left-0 bg-white dark:bg-gray-900 dark:border-gray-800 text-gray-900 h-screen transition-all duration-300 ease-in-out z-50 border-r border-gray-200
        ${isExpanded || isMobileOpen ? "w-[290px]" : isHovered ? "w-[290px]" : "w-[90px]"}
        ${isMobileOpen ? "translate-x-0" : "-translate-x-full"}
        lg:translate-x-0`}
      onMouseEnter={() => !isExpanded && setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Logo */}
      <div className={`py-8 flex ${!isExpanded && !isHovered ? "lg:justify-center" : "justify-start"}`}>
        <Link to="/">
          {isExpanded || isHovered || isMobileOpen ? (
            <>
              <img className="dark:hidden"       src="/images/logo/logo.png"      alt="Logo" width={150} height={40} />
              <img className="hidden dark:block" src="/images/logo/logo-dark.png" alt="Logo" width={150} height={40} />
            </>
          ) : (
            <img src="/images/logo/logo-icon.svg" alt="Logo" width={32} height={32} />
          )}
        </Link>
      </div>

      {/* Nav */}
      <div className="flex flex-col overflow-y-auto duration-300 ease-linear no-scrollbar">
        <nav className="mb-6">
          <div className="flex flex-col gap-4">
            {/* MENU */}
            <div>
              <h2 className={`mb-4 text-xs uppercase flex leading-[20px] text-gray-400 ${!isExpanded && !isHovered ? "lg:justify-center" : "justify-start"}`}>
                {isExpanded || isHovered || isMobileOpen ? "MENU" : <HorizontaLDots className="size-6" />}
              </h2>
              {renderMenuItems(navItems, "main")}
            </div>

            {/* SETTINGS (Master Data + Settings) — hanya tampil jika ada permission */}
            {masterItems.length > 0 && (
              <div>
                <h2 className={`mb-4 text-xs uppercase flex leading-[20px] text-gray-400 ${!isExpanded && !isHovered ? "lg:justify-center" : "justify-start"}`}>
                  {isExpanded || isHovered || isMobileOpen ? "SETTINGS" : <HorizontaLDots className="size-6" />}
                </h2>
                {renderMenuItems(masterItems, "master")}
              </div>
            )}
          </div>
        </nav>
      </div>
    </aside>
  );
};

export default AppSidebar;
