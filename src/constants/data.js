
export const ownerNavItems = [
  {
    title: 'Dashboard',
    url: '/owner/dashboard',
    icon: 'dashboard',
    isActive: false,
    shortcut: ['d', 'd'],
    items: [] 
  },
  {
    title: 'Task Management',
    url: '#', 
    icon: 'billing',
    isActive: true,

    items: [
      {
        title: 'Assign Task',
        url: '/owner/task',
        icon: 'userPen',
        shortcut: ['m', 'm']
      },
      {
        title: 'Map View',
        shortcut: ['l', 'l'],
        url: '/owner/map',
        icon: 'login'
      }
    ]
  },
  {
    title: 'Human Resource',
    url: '#', 
    icon: 'billing',
    isActive: true,

    items: [
      {
        title: 'Attendance',
        url: '/owner/attendance',
        icon: 'userPen',
        shortcut: ['m', 'm']
      },
      {
        title: 'Salary',
        shortcut: ['l', 'l'],
        url: '/owner/salary',
        icon: 'login'
      },
      {
        title: 'Reimbursement',
        shortcut: ['l', 'l'],
        url: '/owner/reimbursement',
        icon: 'login'
      }
    ]
  },
  {
    title: 'Customer',
    url: '#', 
    icon: 'billing',
    isActive: true,

    items: [
      {
        title: 'Detail',
        url: '/owner/customer',
        icon: 'userPen',
        shortcut: ['m', 'm']
      },
      {
        title: 'Feedback',
        shortcut: ['l', 'l'],
        url: '/owner/feedback',
        icon: 'login'
      },
    ]
  },
  {
    title: 'Office Expense',
    url: '/owner/expense',
    icon: 'product',
    shortcut: ['p', 'p'],
    isActive: false,
    items: [] // No child items
  },
  {
    title: 'Inventory',
    url: '/owner/inventory',
    icon: 'product',
    shortcut: ['p', 'p'],
    isActive: false,
    items: [] // No child items
  },
  {
    title: 'Team',
    url: '/owner/team',
    icon: 'product',
    shortcut: ['p', 'p'],
    isActive: false,
    items: [] // No child items
  },
];



export const recentSalesData= [
  {
    id: 1,
    name: 'Olivia Martin',
    email: 'olivia.martin@email.com',
    amount: '+$1,999.00',
    image: 'https://api.slingacademy.com/public/sample-users/1.png',
    initials: 'OM'
  },
  {
    id: 2,
    name: 'Jackson Lee',
    email: 'jackson.lee@email.com',
    amount: '+$39.00',
    image: 'https://api.slingacademy.com/public/sample-users/2.png',
    initials: 'JL'
  },
  {
    id: 3,
    name: 'Isabella Nguyen',
    email: 'isabella.nguyen@email.com',
    amount: '+$299.00',
    image: 'https://api.slingacademy.com/public/sample-users/3.png',
    initials: 'IN'
  },
  {
    id: 4,
    name: 'William Kim',
    email: 'will@email.com',
    amount: '+$99.00',
    image: 'https://api.slingacademy.com/public/sample-users/4.png',
    initials: 'WK'
  },
  {
    id: 5,
    name: 'Sofia Davis',
    email: 'sofia.davis@email.com',
    amount: '+$39.00',
    image: 'https://api.slingacademy.com/public/sample-users/5.png',
    initials: 'SD'
  }
];
