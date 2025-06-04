import React, { useState, useEffect, useCallback } from 'react';
import {
  Table, Button, Input, Select, Modal, Form, Pagination, Space, Popconfirm, Switch, Tag, message, Tooltip
} from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, KeyOutlined, SearchOutlined, ReloadOutlined } from '@ant-design/icons';
import type { ColumnsType, TablePaginationConfig } from 'antd/es/table';
import type { FilterValue } from 'antd/es/table/interface';

import adminUserService, {
  type User, type UserListResponse, type UserCreatePayload, type UserUpdatePayload, type SetPasswordPayload
} from '../../api/adminUserService'; // Adjust path

// Import modal components (will be created next)
import UserFormModal from '../../components/users/UserFormModal';
import SetPasswordModal from '../../components/users/SetPasswordModal';

const { Option } = Select;

interface TableParams {
  pagination?: TablePaginationConfig;
  filters?: Record<string, FilterValue | null>;
  query?: string;
  role?: string;
  is_active?: boolean | null;
}

const UserListPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [totalUsers, setTotalUsers] = useState<number>(0);
  const [tableParams, setTableParams] = useState<TableParams>({
    pagination: {
      current: 1,
      pageSize: 10, // Default page size
    },
    is_active: null, // Explicitly null for "all"
  });

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [roleFilter, setRoleFilter] = useState<string | undefined>(undefined);
  const [isActiveFilter, setIsActiveFilter] = useState<string | undefined>(undefined); // 'true', 'false', or undefined for all

  const [isUserFormModalVisible, setIsUserFormModalVisible] = useState<boolean>(false);
  const [isSetPasswordModalVisible, setIsSetPasswordModalVisible] = useState<boolean>(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [selectedUserIdForPassword, setSelectedUserIdForPassword] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const activeFilter = isActiveFilter === undefined ? undefined : isActiveFilter === 'true';
      const params = {
        page: tableParams.pagination?.current,
        per_page: tableParams.pagination?.pageSize,
        query: searchQuery || undefined,
        role: roleFilter || undefined,
        is_active: activeFilter,
      };
      const response: UserListResponse = await adminUserService.getUsers(params);
      setUsers(response.users);
      setTotalUsers(response.total);
      setTableParams(prev => ({
        ...prev,
        pagination: {
          ...prev.pagination,
          total: response.total,
          current: response.page,
          pageSize: response.per_page,
        }
      }));
    } catch (error: any) {
      message.error(error.response?.data?.detail || error.message || 'Failed to fetch users');
    } finally {
      setLoading(false);
    }
  }, [tableParams.pagination?.current, tableParams.pagination?.pageSize, searchQuery, roleFilter, isActiveFilter]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleTableChange = (pagination: TablePaginationConfig, filters: Record<string, FilterValue | null>) => {
    setTableParams({
      pagination,
      filters, // AntD filters can be mapped to API params if needed
      query: searchQuery,
      role: roleFilter,
      is_active: isActiveFilter === undefined ? null : isActiveFilter === 'true',
    });
  };

  const handleSearch = () => {
    setTableParams(prev => ({ ...prev, pagination: { ...prev.pagination, current: 1 }})); // Reset to page 1 on search
    // fetchData will be called by useEffect due to tableParams change (if current was not 1) or directly if needed
    // To ensure immediate fetch after search query change, call fetchData if params didn't trigger useEffect
    if (tableParams.pagination?.current === 1) fetchData();
  };

  const handleFilterChange = () => {
    setTableParams(prev => ({ ...prev, pagination: { ...prev.pagination, current: 1 }}));
    if (tableParams.pagination?.current === 1) fetchData();
  };

  const resetFiltersAndSearch = () => {
    setSearchQuery('');
    setRoleFilter(undefined);
    setIsActiveFilter(undefined);
    setTableParams(prev => ({
        ...prev,
        pagination: { ...prev.pagination, current: 1 },
        query: undefined,
        role: undefined,
        is_active: null,
    }));
    // fetchData will be called by useEffect due to tableParams change
  };


  const showCreateModal = () => {
    setEditingUser(null);
    setIsUserFormModalVisible(true);
  };

  const showEditModal = (user: User) => {
    setEditingUser(user);
    setIsUserFormModalVisible(true);
  };

  const showSetPasswordModal = (userId: string) => {
    setSelectedUserIdForPassword(userId);
    setIsSetPasswordModalVisible(true);
  };

  const handleUserFormSubmit = async (values: UserCreatePayload | UserUpdatePayload) => {
    setLoading(true);
    try {
      if (editingUser) {
        await adminUserService.updateUser(editingUser.id, values as UserUpdatePayload);
        message.success('User updated successfully');
      } else {
        await adminUserService.createUser(values as UserCreatePayload);
        message.success('User created successfully');
      }
      setIsUserFormModalVisible(false);
      fetchData(); // Refresh list
    } catch (error: any) {
      message.error(error.response?.data?.detail || error.message || 'Failed to save user');
    } finally {
      setLoading(false);
    }
  };

  const handleSetPasswordSubmit = async (values: SetPasswordPayload) => {
    if (!selectedUserIdForPassword) return;
    setLoading(true);
    try {
      await adminUserService.setUserPassword(selectedUserIdForPassword, values);
      message.success('Password updated successfully');
      setIsSetPasswordModalVisible(false);
    } catch (error: any) {
      message.error(error.response?.data?.detail || error.message || 'Failed to set password');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    setLoading(true);
    try {
      await adminUserService.deleteUser(userId);
      message.success('User deleted successfully');
      fetchData(); // Refresh list
    } catch (error: any) {
      message.error(error.response?.data?.detail || error.message || 'Failed to delete user');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActiveStatus = async (userId: string, currentIsActive: boolean) => {
    setLoading(true);
    try {
      await adminUserService.updateUser(userId, { is_active: !currentIsActive });
      message.success(`User ${!currentIsActive ? 'activated' : 'deactivated'} successfully`);
      fetchData();
    } catch (error: any) {
      message.error(error.response?.data?.detail || error.message || 'Failed to update user status');
    } finally {
      setLoading(false);
    }
  };

  const columns: ColumnsType<User> = [
    { title: 'Username', dataIndex: 'username', key: 'username', sorter: (a, b) => a.username.localeCompare(b.username) },
    { title: 'Email', dataIndex: 'email', key: 'email' },
    { title: 'Role', dataIndex: 'role', key: 'role', render: (role: string) => <Tag color={role === 'admin' ? 'volcano' : 'geekblue'}>{role.toUpperCase()}</Tag> },
    {
      title: 'Active',
      dataIndex: 'is_active',
      key: 'is_active',
      render: (isActive: boolean, record: User) => (
        <Switch checked={isActive} onChange={() => handleToggleActiveStatus(record.id, isActive)} loading={loading && editingUser?.id === record.id} />
      ),
      // filterDropdown: ... // Could add filter for is_active directly in table if desired
    },
    { title: 'Created At', dataIndex: 'created_at', key: 'created_at', render: (ts) => ts ? new Date(ts * 1000).toLocaleDateString() : '-', sorter: (a,b) => (a.created_at || 0) - (b.created_at || 0) },
    { title: 'Last Active', dataIndex: 'last_active_at', key: 'last_active_at', render: (ts) => ts ? new Date(ts * 1000).toLocaleString() : 'Never', sorter: (a,b) => (a.last_active_at || 0) - (b.last_active_at || 0)},
    {
      title: 'Action',
      key: 'action',
      render: (_, record: User) => (
        <Space size="middle">
          <Tooltip title="Edit User">
            <Button icon={<EditOutlined />} onClick={() => showEditModal(record)} />
          </Tooltip>
          <Tooltip title="Set Password">
            <Button icon={<KeyOutlined />} onClick={() => showSetPasswordModal(record.id)} />
          </Tooltip>
          <Popconfirm
            title="Are you sure you want to delete this user?"
            onConfirm={() => handleDeleteUser(record.id)}
            okText="Yes"
            cancelText="No"
            disabled={record.id === useAuthStore.getState().user?.id} // Disable deleting self
          >
            <Button icon={<DeleteOutlined />} danger disabled={record.id === useAuthStore.getState().user?.id} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Space style={{ marginBottom: 16 }}>
        <Input
          placeholder="Search Username/Email"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onPressEnter={handleSearch}
          style={{ width: 200 }}
          suffix={<SearchOutlined />}
        />
        <Select
          placeholder="Filter by Role"
          value={roleFilter}
          onChange={(value) => setRoleFilter(value)}
          onSelect={handleFilterChange}
          style={{ width: 120 }}
          allowClear
        >
          <Option value="user">User</Option>
          <Option value="admin">Admin</Option>
          <Option value="pending">Pending</Option>
        </Select>
        <Select
          placeholder="Filter by Status"
          value={isActiveFilter}
          onChange={(value) => setIsActiveFilter(value)}
          onSelect={handleFilterChange}
          style={{ width: 120 }}
          allowClear
        >
          <Option value="true">Active</Option>
          <Option value="false">Inactive</Option>
        </Select>
        <Button onClick={handleSearch} icon={<SearchOutlined />}>Search</Button>
        <Button onClick={resetFiltersAndSearch} icon={<ReloadOutlined />}>Reset</Button>
        <Button type="primary" icon={<PlusOutlined />} onClick={showCreateModal}>
          Create User
        </Button>
      </Space>

      <Table
        columns={columns}
        dataSource={users}
        rowKey="id"
        loading={loading}
        pagination={tableParams.pagination}
        onChange={handleTableChange}
        scroll={{ x: 'max-content' }}
      />

      {isUserFormModalVisible && (
        <UserFormModal
          visible={isUserFormModalVisible}
          onCancel={() => setIsUserFormModalVisible(false)}
          onSubmit={handleUserFormSubmit}
          initialValues={editingUser}
          isEditMode={!!editingUser}
        />
      )}

      {isSetPasswordModalVisible && selectedUserIdForPassword && (
        <SetPasswordModal
          visible={isSetPasswordModalVisible}
          onCancel={() => setIsSetPasswordModalVisible(false)}
          onSubmit={handleSetPasswordSubmit}
          userId={selectedUserIdForPassword}
        />
      )}
    </div>
  );
};

export default UserListPage;
