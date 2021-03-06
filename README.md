# phabrinter

An extension to make Phabricator (`phabricator.services.mozilla.com` instance) usability more similar to Splinter.

This provides the following feature:

 - Clicking each "Path" in "Files" list shows only that file
 - Clicking "All Files" in "Files" list shows all files
 - "Reviewed" checkbox is added to each file, and that state is saved across reloads (expires in 30 days)
 - Collapsed state ("[-]" button) is added to each file, and that state is saved across reloads (expires in 30 days)
   - This is different than Phabricator's built-in collapsed state
 - Add collapse button ("[-]" button) to file list, to make the file list similar to Splinter
 - Add "Show context" button to each comment summary, to show the context about the code and the previous comments, for each comment

# Install

Available at https://addons.mozilla.org/en-US/firefox/addon/phabrinter/
