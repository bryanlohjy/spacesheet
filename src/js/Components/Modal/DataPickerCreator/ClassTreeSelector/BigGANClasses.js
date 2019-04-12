const classTree = [
  {
    id: 1,
    name: 'Animals',
    isExpanded: true,
    children: [
      {
        id: 2,
        name: 'Level Two',
        isExpandable: false,
      }
    ]
  },
  {
    id: 3,
    name: 'Object-0',
    isExpanded: true,
    children: [
      {
        id: 4,
        name: 'Object 1-0'
      },
      {
        id: 5,
        name: 'Object 1-1',
        isExpanded: true,
        children: [
          {
            id: 6,
            name: 'Object 2-0'
          },
          {
            id: 7,
            name: 'Object 2-1',
            isExpanded: true,
            children: [
              {
                id: 8,
                name: 'Object 2-0'
              },
              {
                id: 9,
                name: 'Object 2-1',
                isExpanded: true,
                children: [
                  {
                    id: 10,
                    name: 'Object 2-0'
                  },
                ]
              }
            ]
          }
        ]
      },
    ]
  }
];

export default classTree;
