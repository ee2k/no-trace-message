# Progress track

## To-do list

- When a user joins a chatroom, use a system message to list all existing members

- add a small explanation line after chatroom and burn after reading message in main page, including chatroom expiry texts

- add phone call functionality (1v1)

- fix mobile chrome display problem

- Fix Safari websocket issue:
```text
assume the url is
http://localhost/chatroom/abc

if user1 change the url to
http://localhost/chatroom/abcde, and don't enter, nothing will happen

if user1 change the url to
http://localhost/chatroom/abcde, and then click outside the url bar, nothing will happen

but if change the url to
http://localhost/chatroom/abcde, and then back to http://localhost/chatroom/abc

other users in the chatroom would get message that user1 joined

and then click outside the url bar, other users would get message that user1 left.

and meanwhile, user1's chatroom page still shows connected.

if other users send a message, user1 will receive it. and user1 send a message, other users  will receive it as well but only as User + id
```

- Failed chatroom join attempt notification

Notify users in the chatroom if there're failed attempts to join the chatroom

- Test resend button

Test if the resend button could appear if message sending fails

- Add participant list display when clicking on room info

- Remove or refactor ParticipantStatus