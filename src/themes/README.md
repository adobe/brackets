Brackets-Themes
===============

Set CodeMirror and Custom themes in Brackets.


Features
===============

* Automatic loading of CodeMirror's themes shipped with Brackets.
* Enjoy a variety of <i>custom</i> themes created by other users like yourself! For <i>custom</i> themes 101 primer, please read below.
* Configure font size and font type.
* Disable scrollbars defined in themes.  Good if you just want to use the default scrollbars.
* Support for LESS files!
* Auto reload themes upon saving changes made to theme files.
* Configure custom folders to load themes from.  This is good if you want to have a folder to hold your custom themes that you want to persist after Brackets/Themes updates.


Screenshot
===============
<b>Visual Studio theme</b>
![Visual Studio theme](https://raw.github.com/wiki/MiguelCastillo/Brackets-Themes/images/VisualStudio.png)

<b>Monokai Dark Soda custom theme by @simpleshadow.</b>
![Monokai Dark Soda theme](https://raw.github.com/wiki/MiguelCastillo/Brackets-Themes/images/MonokaiDarkSoda.png)

Custom themes 101 guide
===============

Custom themes are codemirror's themes, so you will need to be familiar with codemirror's theme guidelines.  I provide a set of steps to get you started below, but for more details please navigate to http://codemirror.net/doc/manual.html and search for "theme".
<br><br>
Codemirror's themes are css files.  Important requirement is that the file name has to match your css class definition.  E.g. If your theme file is called "default", then your primary css class name needs to be "default".  Codemirror's guidelines require that the actual css class name starts with ".cm-s-", so your fully qualified css class name will be ".cm-s-default".
<br><br>
To get you started, you could use the already existing custom theme "default.css".  Let's do the following.
<br>
- Open the custom theme directory.  Navigate to your themes manager directory (extensions directory/themes) and you will find custom themes in the "theme" directory.  Brackets provides a quick way of accessing your extensions directory... Help > Show Extensions Folder.
- Copy and paste the file "default.css" and rename it to "my-theme.css".
- Open "my-theme.css" and replace "default" with "my-theme", which should end up looking like ".cm-s-my-theme".  You will also have a second class ".CodeMirror", just leave it there and the net result will look like ".cm-s-my-theme.CodeMirror".
- In "my-theme.css", change "background-color: #F8F8F8;" to "backgound-color: red;".
- Relaunch brackets, open a JavaScript file and you should see the document with a red background.
<br><br>
For details on what can be customized, please navigate to http://codemirror.net/doc/manual.html and search for "Customized Styling".  As you will notice, the documentation isn't exhautive but they suggest you use "codemirror.css" as a reference.  Give it a try, it is pretty straight forward.
<br><br>
If you have a cool theme you created and want to share, please send it my way and I will gladly add it to the custom themes.


FAQ
===============

* Why disabling/enabling the scrollbars don't always take effect?
  - This due to the fact that CodeMirror builds "fake" scrollbars that only get created when the document is loaded.  So toggling the scrollbars with the document open might not take effect as expected.  To get around this behavior, reopen the document or restart Brackets.


How to
===============

* Install... Open Brackets then copy and paste https://github.com/MiguelCastillo/Brackets-Themes into File->Install Extension.  You don't need to restart Brackets.
* Set a theme?  Find the Themes menu and make a selection.
![Themes Menu](https://raw.github.com/wiki/MiguelCastillo/Brackets-Themes/images/SetTheme.png)

Credit
==============
Corey Gwin: Monokai Dark Soda<br>
Kulcsár Kázmér: Zamiere<br>
Diego Alvarez: Aquaman<br>
Felipe K. de Mello: Dracula<br>
Fernando Hurtado: Nando<br>
Jordan Hess: Pixie<br>
John Hamm: Hammsidian<br>
Christopher Kelly (scriptmunkee) for additions to reset.cs<br>


Links
===============
Brackets? Right here... http://brackets.io/ <br>
Brackets github? Right here... https://github.com/adobe/brackets


Contact me
===============

If you have any issues or want to just drop in a line, you can use my personal email at manchagnu@gmail.com

License
===============

Licensed under MIT
