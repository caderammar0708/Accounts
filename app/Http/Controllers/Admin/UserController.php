<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Mail\UserInvitationMail;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;
use Spatie\Permission\Models\Role;

class UserController extends Controller
{
    /**
     * List all users
     */
    public function index(): Response
    {
        $users = User::with(['manager', 'roles'])->get()->map(function ($user) {
            return array_merge($user->toArray(), [
                'assigned_role' => $user->roles->first()?->name ?: ucfirst($user->role ?: 'Staff'),
            ]);
        });

        return Inertia::render('Users/Index', [
            'users' => $users,
        ]);
    }

    /**
     * Show form to create a new user
     */
    public function create(): Response
    {
        $roles = Role::orderBy('name')->get(['id', 'name']);

        return Inertia::render('Users/Create', [
            'roles' => $roles,
        ]);
    }

    /**
     * Store the new user
     */
    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users,email',
            'role' => 'required|string|exists:roles,name',
            'phone' => ['nullable', 'string', 'max:20'],
            'mobile_access' => ['nullable', 'boolean'],
        ]);

        $inviteToken = Str::random(64);
        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'role' => strtolower($request->role) === 'admin' ? 'admin' : 'user',
            'phone' => $request->phone,
            'mobile_access' => $request->mobile_access ?? false,
            'is_active' => true,
            'invite_token' => $inviteToken,
            'invite_expires_at' => now()->addHours(48),
            'is_invited' => true,
        ]);

        $user->syncRoles([$request->role]);

        $inviteUrl = route('invite.setup', $inviteToken);
        try {
            Mail::to($user->email)->send(new UserInvitationMail($user, $inviteUrl, auth()->user()));
        } catch (\Exception $e) {
            // Log mail exception if mailer is not configured in local environment
        }

        return redirect()->route('users.index')->with('success', 'User created and invitation email sent successfully.');
    }

    public function resendInvitation(User $user)
    {
        if (! $user->is_invited) {
            return back()->with('error', 'This user has already completed their invitation.');
        }

        $user->update([
            'invite_token' => Str::random(64),
            'invite_expires_at' => now()->addHours(48),
            'is_invited' => true,
        ]);

        $inviteUrl = route('invite.setup', $user->invite_token);
        try {
            Mail::to($user->email)->send(new UserInvitationMail($user, $inviteUrl, auth()->user()));
        } catch (\Exception $e) {
            // Log mail exception
        }

        return back()->with('success', 'Invitation resent successfully.');
    }

    public function edit(User $user)
    {
        $roles = Role::orderBy('name')->get(['id', 'name']);
        $assignedRole = $user->roles->first()?->name ?: ucfirst($user->role ?: 'Staff');

        return Inertia::render('Users/Edit', [
            'userToEdit' => array_merge($user->toArray(), [
                'role' => $assignedRole,
            ]),
            'roles' => $roles,
        ]);
    }

    public function update(Request $request, User $user)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users,email,' . $user->id,
            'role' => 'required|string|exists:roles,name',
            'phone' => ['nullable', 'string', 'max:20'],
            'mobile_access' => ['nullable', 'boolean'],
        ]);

        $user->update([
            'name' => $request->name,
            'email' => $request->email,
            'role' => strtolower($request->role) === 'admin' ? 'admin' : 'user',
            'phone' => $request->phone,
            'mobile_access' => $request->mobile_access ?? false,
        ]);

        $user->syncRoles([$request->role]);

        return redirect()->route('users.index')->with('success', 'User updated successfully.');
    }

    /**
     * Delete a user
     */
    public function destroy(User $user)
    {
        // Prevent users from deleting themselves
        if (auth()->id() === $user->id) {
            return back()->with('error', 'You cannot delete your own account.');
        }

        try {
            $user->delete();
        } catch (\Illuminate\Database\QueryException $e) {
            if ($e->getCode() == 23000 || $e->getCode() == 1451) {
                return back()->with('error', 'Cannot delete this user because they have associated transactions or records in the system. Please deactivate the user instead.');
            }
            throw $e;
        }

        return redirect()->route('users.index')->with('success', 'User deleted successfully.');
    }
}
