import { useEffect, useState } from 'react';
import { getBabyProfile, saveBabyProfile } from '../api/babyProfile';

export default function BabyProfileModal({ isOpen, onClose, baby }) {
  const [form, setForm] = useState({
    name: '',
    birthday: '',
    gender: 'female',
    birthHeight: '',
    birthWeight: '',
    height: '',
    weight: '',
  });
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      setSaved(false);
      getBabyProfile().then(profile => {
        if (profile) {
          setForm({
            name: profile.name || '',
            birthday: profile.birthday || '',
            gender: profile.gender || 'female',
            birthHeight: profile.birthHeight || '',
            birthWeight: profile.birthWeight || '',
            height: profile.height || '',
            weight: profile.weight || '',
          });
        }
        setLoading(false);
      });
    }
  }, [isOpen]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await saveBabyProfile(form);
      setSaved(true);
      setTimeout(() => {
        onClose();
        setSaved(false);
      }, 800);
    } catch (e) {
      alert('保存失败: ' + (e?.message || '未知错误'));
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  const inputClass = 'w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-gray-50';
  const labelClass = 'block text-sm font-medium text-gray-600 mb-1';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[85vh] overflow-y-auto">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">👶 宝宝信息</h2>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100 text-gray-400 transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="loading loading-spinner loading-md text-blue-500"></div>
          </div>
        ) : (
          <div className="px-5 py-4 space-y-4">
            <div>
              <label className={labelClass}>宝宝名字</label>
              <input
                type="text"
                className={inputClass}
                placeholder="如：小豆芽"
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              />
            </div>

            <div>
              <label className={labelClass}>生日</label>
              <input
                type="date"
                className={inputClass}
                value={form.birthday}
                onChange={e => setForm(f => ({ ...f, birthday: e.target.value }))}
              />
            </div>

            <div>
              <label className={labelClass}>性别</label>
              <div className="flex gap-3">
                {[
                  { value: 'female', label: '👧 女宝' },
                  { value: 'male', label: '👦 男宝' },
                ].map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => setForm(f => ({ ...f, gender: opt.value }))}
                    className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-all ${form.gender === opt.value ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>出生身高 (cm)</label>
                <input
                  type="number"
                  className={inputClass}
                  placeholder="50"
                  value={form.birthHeight}
                  onChange={e => setForm(f => ({ ...f, birthHeight: e.target.value }))}
                />
              </div>
              <div>
                <label className={labelClass}>出生体重 (kg)</label>
                <input
                  type="number"
                  step="0.1"
                  className={inputClass}
                  placeholder="3.3"
                  value={form.birthWeight}
                  onChange={e => setForm(f => ({ ...f, birthWeight: e.target.value }))}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>当前身高 (cm)</label>
                <input
                  type="number"
                  className={inputClass}
                  placeholder="75"
                  value={form.height}
                  onChange={e => setForm(f => ({ ...f, height: e.target.value }))}
                />
              </div>
              <div>
                <label className={labelClass}>当前体重 (kg)</label>
                <input
                  type="number"
                  step="0.1"
                  className={inputClass}
                  placeholder="10.5"
                  value={form.weight}
                  onChange={e => setForm(f => ({ ...f, weight: e.target.value }))}
                />
              </div>
            </div>

            {form.birthday && (
              <div className="text-xs text-gray-400 text-center">
                宝宝 {calcAge(form.birthday)}
              </div>
            )}
          </div>
        )}

        <div className="px-5 py-4 border-t border-gray-100 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl text-sm font-medium border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
          >
            取消
          </button>
          <button
            onClick={handleSave}
            disabled={saving || loading}
            className="flex-1 py-2.5 rounded-xl text-sm font-medium bg-blue-500 text-white hover:bg-blue-600 disabled:opacity-60 transition-colors"
          >
            {saving ? '保存中...' : saved ? '已保存 ✓' : '保存'}
          </button>
        </div>
      </div>
    </div>
  );
}

function calcAge(birthday) {
  if (!birthday) return '';
  const birth = new Date(birthday);
  const now = new Date();
  const totalMonths = (now.getFullYear() - birth.getFullYear()) * 12 + (now.getMonth() - birth.getMonth());
  if (totalMonths < 1) {
    const days = Math.floor((now - birth) / (1000 * 60 * 60 * 24));
    return `出生${days}天`;
  }
  const years = Math.floor(totalMonths / 12);
  const months = totalMonths % 12;
  if (years > 0) return `${years}岁${months > 0 ? months + '月' : ''}`;
  return `${months}个月`;
}
