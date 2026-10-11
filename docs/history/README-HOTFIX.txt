ANTARA Backend SQL Query Hotfix

Copy the contents of this ZIP into C:\xampp\htdocs\ and allow Windows to overwrite the matching files.

Fixed files:
- api/auth/register.php
- api/auth/login.php
- api/progress/save.php
- api/leaderboard/get.php

Cause: SQL strings contained literal backslash-n sequences from single-quoted PHP strings, which MariaDB parsed as invalid SQL.
