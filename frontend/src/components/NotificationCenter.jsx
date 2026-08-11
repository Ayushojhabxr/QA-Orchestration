import { useEffect, useState } from "react";
import { FiBell, FiCheck } from "react-icons/fi";
import {
  getNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from "../services/notificationService";
import { getSocket } from "../services/socketService";

function NotificationCenter() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const loadNotifications = async () => {
    const data = await getNotifications({ limit: 12 });
    setItems(data.items || []);
    setUnreadCount(data.unreadCount || 0);
  };

  useEffect(() => {
    loadNotifications();
  }, []);

  useEffect(() => {
    const socket = getSocket();
    if (!socket) {
      return undefined;
    }

    const handleNewNotifications = (payload) => {
      const nextItems = Array.isArray(payload) ? payload : [payload];
      setItems((current) => [...nextItems, ...current].slice(0, 20));
      setUnreadCount((current) => current + nextItems.length);
    };

    socket.on("notifications:new", handleNewNotifications);
    return () => socket.off("notifications:new", handleNewNotifications);
  }, []);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="relative rounded-2xl border border-slate-800 bg-slate-950/50 p-3 text-slate-200 transition hover:border-glow hover:text-white"
      >
        <FiBell size={18} />
        {unreadCount ? (
          <span className="absolute -right-1 -top-1 rounded-full bg-aurora px-2 py-0.5 text-[10px] font-bold text-slate-950">
            {unreadCount}
          </span>
        ) : null}
      </button>

      {open ? (
        <div className="absolute right-0 z-30 mt-3 w-[360px] rounded-[1.6rem] border border-slate-800 bg-slate-950/95 p-4 shadow-2xl shadow-cyan-950/40 backdrop-blur-xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Notifications</p>
              <h3 className="mt-2 font-display text-xl font-semibold text-white">Team Activity</h3>
            </div>
            <button
              type="button"
              onClick={async () => {
                await markAllNotificationsRead();
                setItems((current) => current.map((item) => ({ ...item, read: true })));
                setUnreadCount(0);
              }}
              className="text-xs uppercase tracking-[0.2em] text-glow"
            >
              Mark all read
            </button>
          </div>

          <div className="mt-4 space-y-3">
            {items.map((item) => (
              <button
                key={item._id}
                type="button"
                onClick={async () => {
                  if (!item.read) {
                    await markNotificationRead(item._id);
                    setItems((current) =>
                      current.map((entry) =>
                        entry._id === item._id ? { ...entry, read: true } : entry
                      )
                    );
                    setUnreadCount((current) => Math.max(0, current - 1));
                  }
                }}
                className={`w-full rounded-2xl border p-4 text-left transition ${
                  item.read
                    ? "border-slate-800 bg-slate-950/45"
                    : "border-glow/40 bg-glow/10"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <p className="text-sm font-semibold text-white">{item.message}</p>
                  {item.read ? (
                    <FiCheck className="shrink-0 text-slate-500" size={14} />
                  ) : (
                    <span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-glow" />
                  )}
                </div>
                <p className="mt-2 text-xs uppercase tracking-[0.18em] text-slate-500">
                  {item.type} / {new Date(item.createdAt).toLocaleString()}
                </p>
              </button>
            ))}
            {!items.length ? <p className="text-sm text-slate-400">No notifications yet.</p> : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default NotificationCenter;
