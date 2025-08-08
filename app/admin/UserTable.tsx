"use client"
import { useState } from 'react'
import UserRow from './UserRow'
import ConfirmModal from './ConfirmModal'
import { Search, X } from 'lucide-react'
import { client } from '@/sanity/lib/client'

interface User {
  id: string
  name: string
  email: string
  password: string
}

interface UserTableProps {
  users: User[]
}

export default function UserTable({ users: initialUsers }: UserTableProps) {
  const [users, setUsers] = useState<User[]>(initialUsers)
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean
    userId: string | null
    userName: string
    userEmail: string
    isDeleting: boolean
    isSuccess: boolean
  }>({
    isOpen: false,
    userId: null,
    userName: '',
    userEmail: '',
    isDeleting: false,
    isSuccess: false
  })
  const [searchTerm, setSearchTerm] = useState('')

  // Filter users based on search term
  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleDeleteClick = (userId: string, userName: string, userEmail: string) => {
    setDeleteModal({
      isOpen: true,
      userId,
      userName,
      userEmail,
      isDeleting: false,
      isSuccess: false
    })
  }

  const handleDeleteConfirm = async () => {
    if (!deleteModal.userEmail) return;
    
    setDeleteModal(prev => ({ ...prev, isDeleting: true }));
    
    try {
      const res = await fetch('/api/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: deleteModal.userEmail }),
      });
      
      const result = await res.json();
      
      if (!res.ok) {
        throw new Error(result.error || 'Deletion failed');
      }
      
      if (deleteModal.userId) {
        await client.delete(deleteModal.userId);
      }
      
      // Update users list
      setUsers(prev => prev.filter(user => user.email !== deleteModal.userEmail));
      
  setDeleteModal(prev => ({
      ...prev,
      isDeleting: false,
      isSuccess: true,
    }));
    

        setTimeout(() => {
      setDeleteModal({
        isOpen: false,
        userId: null,
        userName: '',
        userEmail: '',
        isDeleting: false,
        isSuccess: false,
      });
    }, 2000);


    } catch (error: unknown) {
  let errorMessage = 'An unknown error occurred';

  if (error instanceof Error) {
    errorMessage = error.message;
  }


  alert(`Error: ${errorMessage}`);
  setDeleteModal(prev => ({ ...prev, isDeleting: false }));
}

  };

  const handleDeleteCancel = () => {
    if (!deleteModal.isDeleting && !deleteModal.isSuccess) {
      setDeleteModal({ 
        isOpen: false, 
        userId: null, 
        userName: '', 
        userEmail: '', 
        isDeleting: false,
        isSuccess: false
      })
    }
  }

  return (
    <>
      {/* Search Input */}
      <div className="p-6 border-b border-gray-200">
        <div className="relative max-w-md">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search users by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="block w-full pl-10 pr-10 py-2.5 border border-gray-300 rounded-lg text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute inset-y-0 right-0 pr-3 flex items-center hover:text-gray-600 transition-colors duration-200"
            >
              <X className="h-5 w-5 text-gray-400" />
            </button>
          )}
        </div>
                
        {/* Search Results Info */}
        <div className="mt-3 text-sm text-gray-600">
          {searchTerm ? (
            <span>
              Showing {filteredUsers.length} of {users.length} users
              {filteredUsers.length === 0 && (
                <span className="text-gray-500 ml-2">- No users found matching {searchTerm}</span>
              )}
            </span>
          ) : (
            <span>Showing all {users.length} users</span>
          )}
        </div>
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                #
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Email
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Password
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Action
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredUsers.length > 0 ? (
              filteredUsers.map((user) => (
                <UserRow
                  key={user.id}
                  user={user}
                  serialNumber={users.findIndex(u => u.id === user.id) + 1}
                  onDelete={() => handleDeleteClick(user.id, user.name, user.email)}
                  isDesktop={true}
                />
              ))
            ) : (
              searchTerm && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <div className="text-gray-500">
                      <Search className="mx-auto h-12 w-12 text-gray-300 mb-4" />
                      <h3 className="text-sm font-medium text-gray-900 mb-1">No users found</h3>
                      <p className="text-sm text-gray-500">
                        Try adjusting your search terms or{' '}
                        <button
                          onClick={() => setSearchTerm('')}
                          className="text-blue-600 hover:text-blue-500 font-medium"
                        >
                          clear search
                        </button>
                      </p>
                    </div>
                  </td>
                </tr>
              )
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden">
        {filteredUsers.length > 0 ? (
          filteredUsers.map((user) => (
            <UserRow
              key={user.id}
              user={user}
              serialNumber={users.findIndex(u => u.id === user.id) + 1}
              onDelete={() => handleDeleteClick(user.id, user.name, user.email)}
              isDesktop={false}
            />
          ))
        ) : (
          searchTerm && (
            <div className="px-4 py-12 text-center">
              <Search className="mx-auto h-12 w-12 text-gray-300 mb-4" />
              <h3 className="text-sm font-medium text-gray-900 mb-1">No users found</h3>
              <p className="text-sm text-gray-500 mb-4">
                Try adjusting your search terms
              </p>
              <button
                onClick={() => setSearchTerm('')}
                className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-colors duration-200"
              >
                Clear search
              </button>
            </div>
          )
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={deleteModal.isOpen}
        userName={deleteModal.userName}
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
        isLoading={deleteModal.isDeleting}
        isSuccess={deleteModal.isSuccess}
      />
    </>
  )
}
