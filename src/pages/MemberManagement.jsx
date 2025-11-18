import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { FiEdit2, FiTrash2, FiRefreshCw, FiUser, FiShield } from 'react-icons/fi';
import { getCurrentUser } from '../services/authService';
import { getAllMembers, getAllRoles, updateMemberRole, deleteMember } from '../services/memberService';

function MemberManagement() {
  const [members, setMembers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingUser, setEditingUser] = useState(null);
  const [selectedRole, setSelectedRole] = useState('');
  const currentUser = getCurrentUser();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [membersData, rolesData] = await Promise.all([
        getAllMembers(),
        getAllRoles()
      ]);
      setMembers(membersData);
      setRoles(rolesData);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error(error.message || 'Gagal memuat data');
    } finally {
      setLoading(false);
    }
  };

  const handleEditRole = (member) => {
    setEditingUser(member);
    setSelectedRole(member.role_id || '');
  };

  const handleSaveRole = async () => {
    if (!editingUser || !selectedRole) {
      toast.error('Pilih role terlebih dahulu');
      return;
    }

    try {
      await updateMemberRole(editingUser.id, parseInt(selectedRole));
      toast.success('Role berhasil diupdate');
      setEditingUser(null);
      setSelectedRole('');
      loadData();
    } catch (error) {
      console.error('Error updating role:', error);
      toast.error(error.message || 'Gagal mengupdate role');
    }
  };

  const handleDeleteMember = async (member) => {
    if (!window.confirm(`Apakah Anda yakin ingin menghapus user "${member.username}"?`)) {
      return;
    }

    try {
      await deleteMember(member.id);
      toast.success('User berhasil dihapus');
      loadData();
    } catch (error) {
      console.error('Error deleting member:', error);
      toast.error(error.message || 'Gagal menghapus user');
    }
  };

  const getRoleBadgeColor = (roleName) => {
    if (!roleName) {
      return 'bg-gray-100 text-gray-600 border-gray-200';
    }
    if (roleName === 'admin') {
      return 'bg-purple-100 text-purple-700 border-purple-200';
    }
    return 'bg-blue-100 text-blue-700 border-blue-200';
  };

  const getMemberRoleName = (member) => {
    // Try role_name first (from updated backend)
    if (member.role_name) {
      return member.role_name;
    }
    // Fallback to roles array (for backward compatibility)
    if (member.roles && member.roles.length > 0) {
      return member.roles[0];
    }
    return null;
  };

  const getMemberRoleDisplayName = (member) => {
    // Try role_display_name first (from updated backend)
    if (member.role_display_name) {
      return member.role_display_name;
    }
    // Fallback to role_display_names array (for backward compatibility)
    if (member.role_display_names && member.role_display_names.length > 0) {
      return member.role_display_names[0];
    }
    return null;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin text-4xl mb-4">⏳</div>
          <p className="text-gray-600">Memuat data member...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Management Member</h1>
          <p className="text-gray-600">Kelola member dan role mereka</p>
        </div>
        <button
          onClick={loadData}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
        >
          <FiRefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {/* Members Table */}
      <div className="bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Username</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Role</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Tanggal Dibuat</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {members.length === 0 ? (
                <tr>
                  <td colSpan="4" className="px-6 py-8 text-center text-gray-500">
                    Tidak ada member
                  </td>
                </tr>
              ) : (
                members.map((member) => (
                  <tr key={member.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {getMemberRoleName(member) === 'admin' ? (
                          <FiShield className="w-4 h-4 text-purple-600" />
                        ) : (
                          <FiUser className="w-4 h-4 text-blue-600" />
                        )}
                        <span className="font-medium text-gray-900">{member.username}</span>
                        {member.id === currentUser?.id && (
                          <span className="px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded">
                            Anda
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {editingUser?.id === member.id ? (
                        <div className="flex items-center gap-2">
                          <select
                            value={selectedRole}
                            onChange={(e) => setSelectedRole(e.target.value)}
                            className="px-3 py-1.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                          >
                            <option value="">Pilih Role</option>
                            {roles.map((role) => (
                              <option key={role.id} value={role.id}>
                                {role.display_name}
                              </option>
                            ))}
                          </select>
                          <button
                            onClick={handleSaveRole}
                            className="px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm transition-colors"
                          >
                            Simpan
                          </button>
                          <button
                            onClick={() => {
                              setEditingUser(null);
                              setSelectedRole('');
                            }}
                            className="px-3 py-1.5 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 text-sm transition-colors"
                          >
                            Batal
                          </button>
                        </div>
                      ) : (
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium border ${getRoleBadgeColor(
                            getMemberRoleName(member)
                          )}`}
                        >
                          {getMemberRoleDisplayName(member) || 'Tidak ada role'}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {new Date(member.created_at).toLocaleDateString('id-ID', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {member.id !== currentUser?.id && (
                          <>
                            <button
                              onClick={() => handleEditRole(member)}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="Edit Role"
                            >
                              <FiEdit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteMember(member)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Hapus Member"
                            >
                              <FiTrash2 className="w-4 h-4" />
                            </button>
                          </>
                        )}
                        {member.id === currentUser?.id && (
                          <span className="text-xs text-gray-400">Tidak dapat diubah</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-700">
          <strong>Catatan:</strong> Anda tidak dapat mengubah atau menghapus akun sendiri. 
          Untuk mengubah role, klik ikon edit pada baris member yang ingin diubah.
        </p>
      </div>
    </div>
  );
}

export default MemberManagement;

