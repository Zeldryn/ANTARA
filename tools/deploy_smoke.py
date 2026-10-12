#!/usr/bin/env python3
"""Run only against a TEST deployment. Creates one disposable account."""
import argparse,http.cookiejar,json,secrets,urllib.request,urllib.error,urllib.parse
STAGE=159
parser=argparse.ArgumentParser(description=__doc__)
parser.add_argument('base_url',help='Example: http://localhost/ANTARA/')
args=parser.parse_args();base=args.base_url.rstrip('/')+'/'
parts=urllib.parse.urlsplit(base);origin=parts.scheme+'://'+parts.netloc
opener=urllib.request.build_opener(urllib.request.HTTPCookieProcessor(http.cookiejar.CookieJar()))
def request(path,data=None,expected=200):
    payload=None if data is None else json.dumps(data).encode()
    req=urllib.request.Request(base+path,data=payload,headers={'Content-Type':'application/json','Origin':origin,'Sec-Fetch-Site':'same-origin'})
    try:response=opener.open(req,timeout=20)
    except urllib.error.HTTPError as exc:response=exc
    with response:
        status=response.code;result=json.load(response)
    assert status==expected,(path,status,result.get('message'))
    if expected<400:assert result.get('success') is True,path
    print('PASS',path,status)
    return result
assert request('api/health.php')['database']=='connected'
request('api/progress/get.php',expected=401)
username='smoke_'+secrets.token_hex(5);password=secrets.token_urlsafe(24)
email=username+'@example.invalid'
payload={'fullName':'Deployment Smoke Test','username':username,'email':email,'password':password,'confirmPassword':password}
uid=request('api/auth/register.php',payload,201)['user']['id']
assert request('api/auth/me.php')['user']['id']==uid
request('api/auth/register.php',payload,409)
if STAGE==157:
    request('api/progress/save.php',{'planet':'earth','progress':100})
    assert any(p['planet']=='earth' and p['progress']==100 for p in request('api/progress/get.php')['progress'])
else:
    event={'planet':'sun','type':'normal','key':'topic-0','label':'Deployment smoke test'}
    assert request('api/progress/mark.php',event)['added'] is True
    assert request('api/progress/mark.php',event)['added'] is False
    planets=request('api/progress/get.php')['planets']
    assert any(p['planet']=='sun' and p['completedMilestones']==1 and p['started'] for p in planets)
    request('api/progress/mark.php',{'planet':'sun','type':'normal','key':'topic-999'},422)
if STAGE<159:
    request('api/leaderboard/submit-score.php',{'game':'deployment-smoke','score':1250},201)
    assert any(e['userId']==uid and e['score']==1250 for e in request('api/leaderboard/get.php?game=deployment-smoke')['entries'])
else:
    rejected=request('api/leaderboard/submit-score.php',{'game':'deployment-smoke','score':1250},410)
    assert rejected['code']=='RAW_SCORE_SUBMISSION_DISABLED'
    assert request('api/leaderboard/get.php?type=completion')['integrity']['serverVerified'] is True
    scores=request('api/leaderboard/get.php?type=game&game=deployment-smoke')
    assert scores['verifiedOnly'] is True and not any(e.get('userId')==uid for e in scores['entries'])
if STAGE>=160:
    request('api/achievements/mark-activity.php',{'key':'first-launch'})
    items=request('api/achievements/get.php')['items']
    assert any(a['code']=='first-step' and a['unlocked'] for a in items)
    assert any(a['code']=='first-launch' and a['unlocked'] for a in items)
if STAGE>=162:
    first=request('api/achievements/notifications.php')['items']
    second=request('api/achievements/notifications.php')['items']
    assert not ({a['code'] for a in first}&{a['code'] for a in second})
new_email=username+'.updated@example.invalid'
updated=request('api/account/update.php',{'action':'profile','fullName':'Updated Smoke User','username':username,'email':new_email})
assert updated['user']['email']==new_email
assert request('api/auth/me.php')['user']['email']==new_email
new_password=secrets.token_urlsafe(24)
request('api/account/update.php',{'action':'password','currentPassword':'wrong-password','newPassword':new_password,'confirmPassword':new_password},422)
request('api/account/update.php',{'action':'password','currentPassword':password,'newPassword':new_password,'confirmPassword':new_password})
request('api/auth/logout.php',{})
assert request('api/auth/me.php')['authenticated'] is False
request('api/auth/login.php',{'identifier':username,'password':password},401)
request('api/auth/login.php',{'identifier':username,'password':new_password})
assert request('api/auth/me.php')['user']['id']==uid
request('api/auth/logout.php',{})
request('api/auth/login.php',{'identifier':new_email,'password':new_password})
assert request('api/auth/me.php')['user']['id']==uid
request('api/auth/logout.php',{})
print('PASS smoke tests for stage',STAGE)
print('Delete disposable test account via admin: user ID',uid,'username',username)
print('Credentials were neither saved nor printed. This test does not verify real game-run scoring or browser UI.')
