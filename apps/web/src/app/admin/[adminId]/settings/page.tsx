export default function AdminSettingsPage() {
  return (
    <div className="flex flex-col flex-1 h-full w-full">
      <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4 bg-background/60 backdrop-blur-md sticky top-0 z-10">
        <span className="text-sm font-medium">Cấu hình chung</span>
      </header>
      <div className="flex flex-1 flex-col gap-6 p-6">
        <div className="text-sm text-muted-foreground">
          Trang cấu hình hệ thống đang được phát triển.
        </div>
      </div>
    </div>
  );
}
