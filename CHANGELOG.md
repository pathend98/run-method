# Changelog

## [0.1.3](https://github.com/pathend98/run-method/compare/v0.1.2...v0.1.3) (2026-09-12)

### Features

- ensure modals appear full-screen on mobile devices ([35a657d](https://github.com/pathend98/run-method/commit/35a657d83ae993d2225c248d9b46e442601f8637))

## [0.1.2](https://github.com/pathend98/run-method/compare/v0.1.1...v0.1.2) (2026-09-12)

### Features

- move training planner header, navigation and summary to a central column view for mobile ([98810e5](https://github.com/pathend98/run-method/commit/98810e514c8723454a9f44c61eeaf68744f15c07))

## [0.1.1](https://github.com/pathend98/run-method/compare/v0.1.0...v0.1.1) (2026-09-10)

### Bug Fixes

- allow CA bundle file to be provided to app for database connectivity ([052413b](https://github.com/pathend98/run-method/commit/052413b6e6e2574dbd0cbfe8bcd0b29583473745))

## [0.1.0](https://github.com/pathend98/run-method/releases/tag/v0.1.0) (2026-09-10)

### Features

- replace all references to training brain with run method ([110ac73](https://github.com/pathend98/run-method/commit/110ac738a1d49ce25f0d4589e8d3b0be8a6427f1))

- replace training brain name with run method ([9f2317c](https://github.com/pathend98/run-method/commit/9f2317ce7ac85b34efe03fee27df1f0621ac4c9e))

- introduce ability to drag and drop activities within week calendar ([b21dcf1](https://github.com/pathend98/run-method/commit/b21dcf1a7473206104df3fcfcd09f4f280da656a))

- introduce ability for activity to be moved into UI ([c09296d](https://github.com/pathend98/run-method/commit/c09296dbc7319d0a9bb51108d0465f33327a0155))

- allow activity date to be edited in PATCH api ([5ea58c2](https://github.com/pathend98/run-method/commit/5ea58c2fa587e753c153a9e46f760407816fa7c4))

- add an attention panel which can be used to highlight that there are past activities which arent complete ([a461568](https://github.com/pathend98/run-method/commit/a461568d8019dd7572b47bd51739eac7d7999cae))

- extend activity API to make date parameters optional and allow querying by status ([b35e887](https://github.com/pathend98/run-method/commit/b35e887fb232aab44e5e01bc47475a06d98df803))

- introduce a weekly summary at the top of a training planner ([4e87e8e](https://github.com/pathend98/run-method/commit/4e87e8e073d118463e9b2e5dd57ab05f37129dae))

- add keycloak to allow work on authn to begin ([e5e40aa](https://github.com/pathend98/run-method/commit/e5e40aadcd8fe918d1941b079d4addbe4f26ad15))

- ensure the same duration format is used throughout the app ([cd10cf6](https://github.com/pathend98/run-method/commit/cd10cf6c338b6237571ebb3f650ab436610418d5))

- ensure form fields are outlined in red when invalid ([52c54ba](https://github.com/pathend98/run-method/commit/52c54baa515e7054f201cd7a0e53a2f8f2ec9ad0))

- ensure skip buttons use warning variant ([210856a](https://github.com/pathend98/run-method/commit/210856a7d9672fb563742bba58f58c0f44013bec))

- ensure skip form doesn't mention skip reason ([a8cb8c7](https://github.com/pathend98/run-method/commit/a8cb8c7a2cf22205e9410e1771210d475c46e51c))

- ensure edit activity modal uses human readable date format ([292030a](https://github.com/pathend98/run-method/commit/292030adb409a4fb397026cf18d1519fa26cbaf4))

- omit activity description when it's not set ([5410751](https://github.com/pathend98/run-method/commit/54107515c33126633b6c1ef5d83f0ffe254e498b))

- establish primary, secondary, tertiary and destructive buttons and use throughout ([2d49c1f](https://github.com/pathend98/run-method/commit/2d49c1ff196b518fae504533d505696e38574df7))

- ensure empty days are referred to as rest days ([524b85a](https://github.com/pathend98/run-method/commit/524b85a12c478517ca0e23ff9516018d6bead866))

- ensure human readable date formats are used in all locations ([13ab2a7](https://github.com/pathend98/run-method/commit/13ab2a730d3ca91cfbf336d7894c4ec5468abf72))

- move activity deletion into a separate modal ([f948361](https://github.com/pathend98/run-method/commit/f94836192e90c8be486992fc63b44c75d2f0341b))

- move activity skipping into a separate modal ([fec51c0](https://github.com/pathend98/run-method/commit/fec51c08781f0f5e7db200a7e3a527a6d2e0f1df))

- simplify activity completion by removing most fields from completion view ([22c669f](https://github.com/pathend98/run-method/commit/22c669fd1433be6ce8edb923248b06be1df7b2d2))

- ensure AM and PM are replaced with Morning and Evening ([bc39589](https://github.com/pathend98/run-method/commit/bc39589e276a31bc699724e4568722ef0312cea5))

- remove boxes in activity details showing metrics ([3b0aec0](https://github.com/pathend98/run-method/commit/3b0aec0e71a6fef802d219ffd1bfff81b5eeee5d))

- reduce number of buttons in activity details modal header ([2567d4a](https://github.com/pathend98/run-method/commit/2567d4a9c48ce367ba4cdf9740e22d847849cde7))

- improve activity cards by introducing activity iconology, metrics and status, and touch up styling ([c6cf65e](https://github.com/pathend98/run-method/commit/c6cf65effa424d8e036b71e20fe5d7138cd3f9b3))

- make buttons for navigation borderless ([2f2bb10](https://github.com/pathend98/run-method/commit/2f2bb103b685a7b11b11a32d2e9ab5c4f14053f6))

- compact week navigation to use &lt; / &gt; buttons ([03cb951](https://github.com/pathend98/run-method/commit/03cb9519bac31ac8a7fde14b983d847a8111f555))

- clean page header to include training plan title and date ([c195a7a](https://github.com/pathend98/run-method/commit/c195a7a19f43ff1b0edf73cbb038991a704176b6))

- give today a different column background in training planner ([c0bad85](https://github.com/pathend98/run-method/commit/c0bad85f899611b699c7a31d3cc5dcd1cf4a5621))

- make add activity button less loud and hide until a day is hovered over ([6bf5d27](https://github.com/pathend98/run-method/commit/6bf5d27bcfa8a49356e6d3f9d2bbceed3c270795))

- compact the weekly training planner into a continuous view ([6170b6f](https://github.com/pathend98/run-method/commit/6170b6fbe9a97d130239a357f2ed0a2820a3de46))

- allow editing actual metrics for completed activities ([b523a34](https://github.com/pathend98/run-method/commit/b523a34f30d57f6caab7d0c06d1ca014617def6a))

- make actual distance and duration mutable for completed activities ([15bbe30](https://github.com/pathend98/run-method/commit/15bbe30e5ed1ed05610eb731ed41f898fea1ab97))

- ensure actual run / strength metrics are given visual priority over targets for completed activities ([3919266](https://github.com/pathend98/run-method/commit/39192669ee16454ce2d96e9921c9ba702cb08522))

- simplify run data model by removing pace fields and target type discriminated union ([5078f96](https://github.com/pathend98/run-method/commit/5078f9665868b161e4717a71048c80ea0227bd0e))

- introduce simplified three-field input model for run targets ([bfd5f2c](https://github.com/pathend98/run-method/commit/bfd5f2c5598e27b9fa4e7454d176c06378d051ac))

- move activity actions to zustand state ([c1a64bd](https://github.com/pathend98/run-method/commit/c1a64bd40d2143c0344ec15eed4602a3d1f9276d))

- move duration input to a three box input supporting the hh:mm:ss format ([1f6e0ca](https://github.com/pathend98/run-method/commit/1f6e0cae20bc6452c5fcdfd4ec63ebb95a5ce52b))

- move modal navigation into zustand store ([a8d792c](https://github.com/pathend98/run-method/commit/a8d792c331f0e12541ca7f4f7a7df10bcdb47343))

- give different appearance to completed and skipped activities ([12464f4](https://github.com/pathend98/run-method/commit/12464f4b605f8cf06c0437038c936bbc802e2402))

- ensure training sessions can't be completed or skipped if they're in the future ([89814e0](https://github.com/pathend98/run-method/commit/89814e063c63086bb1625450ef6ed2331f1efb71))

- add ability to skip and complete activities ([806cdae](https://github.com/pathend98/run-method/commit/806cdae0d6036e1aa381320ef0d52c3facfcce48))

- add API endpoints allowing for activities to be skipped and completed ([407fd84](https://github.com/pathend98/run-method/commit/407fd8474e77c5573c79946e92f7832884f6ef06))

- introduce ability to delete activities to UI ([90d9942](https://github.com/pathend98/run-method/commit/90d994228c7d129107f539d52ee7075f02b070c5))

- introduce ability to delete activity to API ([a374b11](https://github.com/pathend98/run-method/commit/a374b1162699b980a184ed706d61901712fac457))

- introdice ability to UI to edit strength duration ([ad86439](https://github.com/pathend98/run-method/commit/ad864393ba2031abd9fa83123cc66b6429e3e989))

- change the API to allow for the duration of strength training activities to be updated ([f45eb58](https://github.com/pathend98/run-method/commit/f45eb58c84d8673be6f8b2bd2924dd2a7e961af9))

- introduce ability to edit an activity ([0f8ffc6](https://github.com/pathend98/run-method/commit/0f8ffc6bc7b0bc9a8530dfdb49e76c2d222e20d0))

- add API endpoint to support activity modification ([fd0fe6d](https://github.com/pathend98/run-method/commit/fd0fe6dad95d2f9703326a7cd10ff2d9b0cef38f))

- ensure all target activity fields are given equal preference ([9f096c8](https://github.com/pathend98/run-method/commit/9f096c8aafb9b6d3673f05093510cfaad81d5c46))

- allow missing run target fields to be calculated if the other two fields can be used to calculate them ([f7e80e8](https://github.com/pathend98/run-method/commit/f7e80e86d44448660ecce13a64c33a7221478d86))

- introduce ability to navigate between different training weeks ([ee6a22b](https://github.com/pathend98/run-method/commit/ee6a22b7388b5190c67a1fb984e57d5898ae4a87))

- introduce ability to add activity to UI ([271fe4c](https://github.com/pathend98/run-method/commit/271fe4cf9f3a64821023188e5901005faf12431b))

- add api endpoint to create activities ([3167ce1](https://github.com/pathend98/run-method/commit/3167ce11228cac57adad7ffb0c0b161ce24ea264))

- replace activity side panel with modal ([605fbb4](https://github.com/pathend98/run-method/commit/605fbb419baea81a90d09dbb6b98fcc419bddd3e))

- move the detailed activity view to a side panel ([985ad07](https://github.com/pathend98/run-method/commit/985ad07f373946b7ebce4c3e23ba5f39e95ce644))

- add activity side panel which shows full activity details when one is clicked ([00f4c55](https://github.com/pathend98/run-method/commit/00f4c55d699cc734571b81e4bdfca58c92e32354))

- add data model for training activities and ensure UI fetches activities through API ([9e9c042](https://github.com/pathend98/run-method/commit/9e9c042e083fc401b62e64f81f339219f30124b0))

### Bug Fixes

- ensure environment variables are evaluated at run time instead of compile time to allow docker build to succeed without them ([857d9c1](https://github.com/pathend98/run-method/commit/857d9c1b4da0a14aa932262365acf88545c45be0))

- tone down background colour for today column ([46e87c8](https://github.com/pathend98/run-method/commit/46e87c8de901c62752f860f06f5efbe7f7d7cff2))

- ensure computed form fields don't use invalid values ([6d0f78b](https://github.com/pathend98/run-method/commit/6d0f78b1c976a9a49d493f3acde90eb92650548e))

- ensure pointer cursor is used when hovering over buttons and clickable content ([300a699](https://github.com/pathend98/run-method/commit/300a699ac45fbfdf4872a8802becc923c5a46fd5))

- ensure hydration warning is supressed ([c6e965e](https://github.com/pathend98/run-method/commit/c6e965eeab862b2fdd4744583ed8d8b20f273d9d))

- ensure pnpm-workspace.yaml is included in docker build process ([08719c7](https://github.com/pathend98/run-method/commit/08719c71fa088ec420201e6cb23ae08b4537e5bf))
