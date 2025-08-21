export default {
  name: 'forgetPassword',
  title: 'Forget Password',
  type: 'document',
  fields: [
    {
      name: 'userEmail',
      title: 'Email',
      type: 'email',

    },
    {
      name: 'password',
      title: 'Password',
      type: 'string',
     
    },
    {
      name: 'updatedAt',
      title: 'Updated At',
      type: 'datetime',
    
    }
  ]
}
