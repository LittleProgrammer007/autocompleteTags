# autocompleteTags

功能点
	 1.显示已选标签，按照它的添加顺序排列。
	 2.显示可用标签时，按照字母序排列。
	 3.可在输入框添加新的标签。当在输入框中输入分割字符时，分割字符前的值将作为新标签的值。
	 4.可在提示的下拉框中选择可用的标签。可通过上下箭头选择，点击或Enter确认。当输入框中有输入值时，根据该值进行过滤。
	 5.可点击‘+’，在弹出的对话框中选择。
	 6.弹出对话框中的输入框只通过Enter确认输入新标签。
	 7.添加的新标签不能和已有标签重复，但可是可选标签中存在的。如果这个标签是个新标签，即不存在可选标签中，此时是否需要添加个钩子，让用户判断是否创建？
	 8.只读
	 9.配置刷新
   	10.语言配置
   
问题：
  只读是通过添加class实现，还是通过修改DOM实现？
  如果这个标签是个新标签，即不存在可选标签中，此时是否需要添加个钩子，让用户判断是否创建？
  
更新日志：
  2018-03-14: 功能1、2、3、5、6实现，功能7、8部分实现
  
技术：
  ES6
