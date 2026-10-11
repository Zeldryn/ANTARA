#!/usr/bin/env python3
"""Run on a TEST deployment after SQL import; creates one disposable test account."""
import argparse, http.cookiejar, json, secrets, urllib.request, urllib.error

parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('base_url', help='Example: http://localhost/ANTARA/')
args = parser.parse_args()
base = args.base_url.rstrip('/') + '/'
opener = urllib.request.build_opener(urllib.request.HTTPCookieProcessor(http.cookiejar.CookieJar()))
def request(path, data=None, expected=200):
    payload = None if data is None else json.dumps(data).encode()
    req = urllib.request.Request(base + path, data=payload, headers={'Content-Type': 'application/json'})
    try:
        response = opener.open(req, timeout=20)
    except urllib.error.HTTPError as exc:
        response = exc
    with response:
        status = response.code
        result = json.load(response)
    assert status == expected, (path, status, result.get('message'))
    if expected < 400:
        assert result.get('success') is True, path
    print('PASS', path, status)
    return result

health = request('api/health.php')
assert health.get('database') == 'connected'
request('api/progress/get.php', expected=401)
username = 'smoke_' + secrets.token_hex(5)
password = secrets.token_urlsafe(24)
payload = {'fullName': 'Deployment Smoke Test', 'username': username,
           'email': username + '@example.invalid', 'password': password, 'confirmPassword': password}
registered = request('api/auth/register.php', payload, 201)
user_id = registered['user']['id']
assert request('api/auth/me.php')['user']['id'] == user_id
request('api/auth/register.php', payload, 409)
request('api/progress/save.php', {'planet': 'earth', 'progress': 100})
request('api/progress/save.php', {'planet': 'earth', 'progress': 30})
progress = request('api/progress/get.php')['progress']
assert any(p['planet'] == 'earth' and p['progress'] == 100 and p['completed'] for p in progress)
request('api/leaderboard/submit-score.php', {'game': 'deployment-smoke', 'score': 1250}, 201)
entries = request('api/leaderboard/get.php?game=deployment-smoke')['entries']
assert any(e['userId'] == user_id and e['score'] == 1250 for e in entries)
request('api/auth/logout.php', {})
assert request('api/auth/me.php')['authenticated'] is False
request('api/auth/login.php', {'identifier': username, 'password': 'wrong-password'}, 401)
request('api/auth/login.php', {'identifier': username, 'password': password})
assert request('api/auth/me.php')['user']['id'] == user_id
request('api/auth/logout.php', {})
request('api/auth/login.php', {'identifier': payload['email'], 'password': password})
assert request('api/auth/me.php')['user']['id'] == user_id
request('api/auth/logout.php', {})
print('PASS auth, session, persistent progress and leaderboard.')
print('Delete disposable test user via admin: user ID', user_id, 'username', username)
print('No credentials were saved or printed. Foreign keys delete related test rows when user is deleted.')
