require 'test_helper'

class MagissuesControllerTest < ActionController::TestCase
  setup do
    @magissues = magazines(:one)
  end

  test "should get index" do
    get :index
    assert_response :success
    assert_not_nil assigns(:magissues)
  end

  test "should get new" do
    get :new
    assert_response :success
  end

  test "should create magissues" do
    assert_difference('Magissues.count') do
      post :create, magissues: { date: @magissues.date, name: @magissues.name, number: @magissues.number, status: @magissues.status, volume: @magissues.volume }
    end

    assert_redirected_to magazine_path(assigns(:magissues))
  end

  test "should show magissues" do
    get :show, id: @magissues
    assert_response :success
  end

  test "should get edit" do
    get :edit, id: @magissues
    assert_response :success
  end

  test "should update magissues" do
    put :update, id: @magissues, magissues: { date: @magissues.date, name: @magissues.name, number: @magissues.number, status: @magissues.status, volume: @magissues.volume }
    assert_redirected_to magazine_path(assigns(:magissues))
  end

  test "should destroy magissues" do
    assert_difference('Magissues.count', -1) do
      delete :destroy, id: @magissues
    end

    assert_redirected_to magazines_path
  end
end
