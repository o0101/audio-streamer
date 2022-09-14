# audio-streamer

A series of experiments in streaming live audio using: HTTP, WebSockets, WebRTC and others

# why

I'm creating this because my [remote browser product](https://github.com/crisdosyago/BrowserBox) requires audo streaming and I haven't figured it out yet. 

# methodology

Try a few different methods that are capable of going from server (node.js + native + shell) to client (web + browser + javascript).

# what I'm doing

- HTTP

I already do this, but it suffers from congestion and drop-outs in low bandwidth conditions.

- WebSockets

I want to try this. I understand it on a basic level.

- WebRTC

Already use it for sending screencast frames, but I want to try this for audio. I do not undertand it at all. 

# the idea

Test these out and see which is the most robust (to bandwidth conditions) and gives the best developer experience.

# thanks!


